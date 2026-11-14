import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Button,
  Callout,
  Card,
  FormGroup,
  H2,
  H4,
  HTMLTable,
  InputGroup,
  Intent,
  Spinner,
  Tag,
} from "@blueprintjs/core";
import { apiRequest } from "../lib/api";
import { showError } from "../lib/toaster";

interface FutureCareersResponse {
  focusRole: string;
  focusAnalysis: {
    demandTrend: string;
    evolutionSummary: string;
    coreFutureSkills: string[];
  };
  emergingRoles: Array<{
    role: string;
    growthSignal: string;
    whyEmerging: string;
    keySkills: string[];
  }>;
  briefingNarrative: string;
  marketDocs: Array<{
    slug: string;
    title: string;
    path: string;
    sourceUrl: string | null;
    updatedAt: string;
    summary: string | null;
  }>;
  engine: string;
}

export default function AiFutureCareersPage() {
  const [focusRole, setFocusRole] = useState("Platform Engineer");
  const [data, setData] = useState<FutureCareersResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (role?: string) => {
    setLoading(true);
    try {
      const qs = role ? `?focusRole=${encodeURIComponent(role)}` : "";
      const res = await apiRequest<FutureCareersResponse>(`/api/ai/future-careers${qs}`);
      setData(res);
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to load future career trends");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("Platform Engineer");
  }, [load]);

  const handleExplore = async (e: FormEvent) => {
    e.preventDefault();
    await load(focusRole.trim() || "Platform Engineer");
  };

  if (loading && !data) {
    return (
      <Card>
        <div className="st-row" style={{ justifyContent: "center", padding: 36 }}>
          <Spinner size={28} />
        </div>
      </Card>
    );
  }

  return (
    <div className="st-stack">
      <Card>
        <div className="st-between">
          <div>
            <H2 style={{ margin: 0 }}>AI Future Careers & Industry Trends</H2>
            <p className="bp5-text-muted" style={{ margin: "4px 0 0 0", fontSize: 13 }}>
              Explore emerging IT specializations, role transformations, and weekly updated <code>/market-docs</code>.
            </p>
          </div>
          {data && <Tag minimal>Engine: {data.engine}</Tag>}
        </div>
      </Card>

      <Card>
        <form onSubmit={handleExplore} className="st-row" style={{ alignItems: "flex-end" }}>
          <FormGroup label="Inspect How a Specific Role Is Evolving" style={{ flex: 1, marginBottom: 0 }}>
            <InputGroup
              value={focusRole}
              onChange={(e) => setFocusRole(e.target.value)}
              placeholder="e.g. Backend API Developer, Platform Engineer, Data Engineer..."
            />
          </FormGroup>
          <Button
            type="submit"
            intent={Intent.PRIMARY}
            icon="trending-up"
            loading={loading}
            text="Analyze Role Evolution"
          />
        </form>
      </Card>

      {data && (
        <>
          <Callout intent={Intent.PRIMARY} title={`Career Intelligence Briefing: ${data.focusRole}`}>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
              {data.briefingNarrative}
            </pre>
          </Callout>

          <Card className="st-stack">
            <div className="st-between">
              <H4 style={{ margin: 0 }}>{data.focusRole} — Outlook</H4>
              <Tag intent={Intent.SUCCESS}>{data.focusAnalysis.demandTrend}</Tag>
            </div>
            <p style={{ margin: 0 }}>{data.focusAnalysis.evolutionSummary}</p>
            <div className="st-row">
              {data.focusAnalysis.coreFutureSkills.map((s) => (
                <Tag key={s} intent={Intent.PRIMARY}>
                  {s}
                </Tag>
              ))}
            </div>
          </Card>

          <div className="st-grid-3">
            {data.emergingRoles.map((er) => (
              <Card key={er.role} className="st-stack">
                <div className="st-between">
                  <H4 style={{ margin: 0 }}>{er.role}</H4>
                  <Tag intent={Intent.SUCCESS} minimal>
                    {er.growthSignal}
                  </Tag>
                </div>
                <p style={{ margin: 0, fontSize: 13 }}>{er.whyEmerging}</p>
                <div className="st-row">
                  {er.keySkills.map((s) => (
                    <Tag key={s} minimal>
                      {s}
                    </Tag>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <H4>Indexed Market Research Documents (/market-docs)</H4>
            <HTMLTable striped style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Path</th>
                  <th>Source</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.marketDocs.map((doc) => (
                  <tr key={doc.slug}>
                    <td>
                      <strong>{doc.title}</strong>
                    </td>
                    <td>
                      <code>{doc.path}</code>
                    </td>
                    <td style={{ fontSize: 12 }}>{doc.sourceUrl || "Curated brief"}</td>
                    <td>{new Date(doc.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </HTMLTable>
          </Card>
        </>
      )}
    </div>
  );
}
