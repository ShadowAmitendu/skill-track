import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Callout,
  Card,
  Drawer,
  H2,
  HTMLTable,
  Intent,
  NonIdealState,
  Spinner,
  Tag,
  Tree,
  type TreeNodeInfo,
} from "@blueprintjs/core";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { showError } from "../lib/toaster";
import type { SkillCategoryGroupDTO } from "../types/api";

interface SkillNodeData {
  kind: "skill";
  categoryName: string;
  skill: SkillCategoryGroupDTO["skills"][number];
}

export default function SkillsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canInspectTrainees = user?.role === "admin" || user?.role === "cp";

  const [groups, setGroups] = useState<SkillCategoryGroupDTO[]>([]);
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<SkillNodeData | null>(null);

  useEffect(() => {
    setLoading(true);
    apiRequest<{ categories: SkillCategoryGroupDTO[] }>("/api/skills")
      .then((res) => {
        setGroups(res.categories);
        const expanded: Record<number, boolean> = {};
        res.categories.forEach((c) => {
          expanded[c.id] = true;
        });
        setExpandedMap(expanded);
      })
      .catch((err) => void showError(err instanceof Error ? err.message : "Failed to load skills"))
      .finally(() => setLoading(false));
  }, []);

  const treeNodes: TreeNodeInfo<SkillNodeData>[] = groups.map((cat) => ({
    id: `cat-${cat.id}`,
    label: cat.name,
    icon: "folder-open",
    isExpanded: Boolean(expandedMap[cat.id]),
    secondaryLabel: (
      <Tag minimal>{cat.skills.length} skills</Tag>
    ),
    childNodes: cat.skills.map((skill) => ({
      id: `skill-${skill.id}`,
      icon: "badge",
      label: skill.name,
      nodeData: { kind: "skill", categoryName: cat.name, skill },
      secondaryLabel: (
        <Tag
          minimal
          intent={skill.traineeCount > 0 ? Intent.PRIMARY : Intent.NONE}
          style={{ cursor: canInspectTrainees ? "pointer" : "default" }}
        >
          {skill.traineeCount} trainees
        </Tag>
      ),
    })),
  }));

  const handleNodeClick = (node: TreeNodeInfo<SkillNodeData>) => {
    if (node.nodeData?.kind === "skill" && canInspectTrainees) {
      setSelectedSkill(node.nodeData);
    } else if (String(node.id).startsWith("cat-")) {
      const id = Number(String(node.id).replace("cat-", ""));
      setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
    }
  };

  return (
    <div className="st-stack">
      <Card>
        <div className="st-between">
          <div>
            <H2 style={{ margin: 0 }}>Skills Taxonomy</H2>
            <p className="bp5-text-muted" style={{ margin: "4px 0 0 0", fontSize: 13 }}>
              All platform skills grouped by category (for example Docker, Kubernetes, and Jenkins under DevOps).
            </p>
          </div>
          {canInspectTrainees && (
            <Tag intent={Intent.PRIMARY} minimal>
              Click any skill to inspect trainees
            </Tag>
          )}
        </div>
      </Card>

      {!canInspectTrainees && (
        <Callout intent={Intent.NONE} icon="info-sign">
          Trainee counts are aggregated per skill. Individual trainee lists are restricted to Admin and Course Provider accounts.
        </Callout>
      )}

      {loading ? (
        <Card>
          <div className="st-row" style={{ justifyContent: "center", padding: 36 }}>
            <Spinner size={28} />
          </div>
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <NonIdealState icon="badge" title="No skills defined" description="Seed or create skill categories to view the taxonomy." />
        </Card>
      ) : (
        <Card>
          <Tree
            contents={treeNodes}
            onNodeClick={handleNodeClick}
            onNodeExpand={(node) => {
              const id = Number(String(node.id).replace("cat-", ""));
              setExpandedMap((prev) => ({ ...prev, [id]: true }));
            }}
            onNodeCollapse={(node) => {
              const id = Number(String(node.id).replace("cat-", ""));
              setExpandedMap((prev) => ({ ...prev, [id]: false }));
            }}
          />
        </Card>
      )}

      <Drawer
        isOpen={Boolean(selectedSkill)}
        onClose={() => setSelectedSkill(null)}
        title={
          selectedSkill
            ? `${selectedSkill.skill.name} (${selectedSkill.categoryName}) — Trainees`
            : ""
        }
        size="420px"
      >
        <div style={{ padding: 16 }}>
          {!selectedSkill?.skill.trainees || selectedSkill.skill.trainees.length === 0 ? (
            <NonIdealState
              icon="people"
              title="No trainees with this skill"
              description="Trainees appear here when verified through course completion or detected on a resume (subject to consent for CPs)."
            />
          ) : (
            <HTMLTable striped interactive style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Trainee</th>
                  <th>Track</th>
                  <th style={{ textAlign: "right" }}>Profile</th>
                </tr>
              </thead>
              <tbody>
                {selectedSkill.skill.trainees.map((t) => (
                  <tr key={t.id}>
                    <td>{t.fullName}</td>
                    <td>
                      <Tag minimal>{t.roleCategory}</Tag>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Button
                        small
                        icon="eye-open"
                        text="View"
                        onClick={() => {
                          setSelectedSkill(null);
                          navigate(`/trainees/${t.id}`);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </HTMLTable>
          )}
        </div>
      </Drawer>
    </div>
  );
}
