import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { courseApi, traineeApi } from "../api/endpoints";
import { useAuth } from "../context/useAuth";
import { Award, Users } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Divider, EntityTitle, H2 } from "@blueprintjs/core";
import { Card, CardList } from "../components/ui/Card";
import { Input } from "../components/ui/Field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../components/ui/Dialog";
import { Avatar } from "../components/ui/Avatar";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/QueryState";

export default function Skills() {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedSkill, setSelectedSkill] = useState(null);

  const canDrillDown = role === "ADMIN" || role === "COURSE_PROVIDER";

  const {
    data: skills = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["skillsSummary"],
    queryFn: ({ signal }) => courseApi.getSkillsSummary(signal),
    staleTime: 60000,
  });

  // Load trainees when admin/cp to resolve ID links & fallback drill-down if DTO omits traineeNames
  const { data: trainees = [] } = useQuery({
    queryKey: ["trainees"],
    queryFn: ({ signal }) => traineeApi.getAll(signal),
    enabled: canDrillDown,
    staleTime: 60000,
  });

  const categorizedSkills = useMemo(() => {
    const q = search.trim().toLowerCase();
    const groups = {};
    skills
      .filter(
        (item) =>
          !q ||
          item.skillName?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q)
      )
      .forEach((skill) => {
        const cat = skill.category || "General";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(skill);
      });
    return groups;
  }, [skills, search]);

  const matchedTraineesForSkill = useMemo(() => {
    if (!selectedSkill || !canDrillDown) return [];
    const targetName = selectedSkill.skillName?.toLowerCase();
    const fromRegistry = trainees.filter((t) =>
      (t.skills || []).some((s) => s.toLowerCase() === targetName)
    );
    if (fromRegistry.length > 0) return fromRegistry;

    return (selectedSkill.traineeNames || []).map((name, idx) => ({
      id: null,
      fullName: name,
      key: `${name}-${idx}`,
    }));
  }, [selectedSkill, canDrillDown, trainees]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <H2 className="!mb-0">Skills Registry</H2>
          <p className="bp6-text-muted text-xs mt-1">
            Skills grouped by category with enrolled and verified trainee counts.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Input
            leftIcon="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skill or category..."
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Loading skills summary..." rows={4} />
      ) : isError ? (
        <ErrorState title="Failed to load skills summary" error={error} onRetry={refetch} />
      ) : Object.keys(categorizedSkills).length === 0 ? (
        <EmptyState
          icon={<Award size={28} />}
          title="No matching skills"
          description="Try a different keyword or category name."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(categorizedSkills).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="primary" minimal={false}>{category}</Badge>
                <span className="text-xs bp6-text-muted">
                  {items.length} {items.length === 1 ? "skill" : "skills"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((skill) => {
                  const traineeCount = skill.enrolledTraineesCount ?? skill.traineeNames?.length ?? 0;

                  return (
                    <Card
                      key={skill.skillId || skill.skillName}
                      interactive={canDrillDown}
                      onClick={canDrillDown ? () => setSelectedSkill(skill) : undefined}
                      role={canDrillDown ? "button" : undefined}
                      tabIndex={canDrillDown ? 0 : undefined}
                      onKeyDown={
                        canDrillDown
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedSkill(skill);
                              }
                            }
                          : undefined
                      }
                    >
                      <EntityTitle
                        icon={<Award size={16} className="bp6-text-muted" />}
                        title={skill.skillName}
                        subtitle={category}
                      />

                      {canDrillDown && (
                        <>
                          <Divider className="!my-3" />

                          <div className="flex items-center justify-between text-xs">
                            <span className="bp6-text-muted inline-flex items-center gap-1.5">
                              <Users size={13} /> {traineeCount}{" "}
                              {traineeCount === 1 ? "trainee" : "trainees"}
                            </span>
                            <span className="font-medium text-[#2d72d2] dark:text-[#8abbff]">
                              View trainees &rarr;
                            </span>
                          </div>
                        </>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skill -> Trainees Drill-down Dialog */}
      <Dialog open={Boolean(selectedSkill)} onOpenChange={(open) => !open && setSelectedSkill(null)}>
        <DialogContent maxWidth="max-w-md" icon={<Award size={16} />}>
          <DialogHeader>
            <DialogTitle>{selectedSkill?.skillName}</DialogTitle>
            <DialogDescription>
              Trainees with verified or active skill association ({selectedSkill?.category}).
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 overflow-y-auto">
            {matchedTraineesForSkill.length > 0 ? (
              <CardList bordered>
                {matchedTraineesForSkill.map((t) => (
                  <Card key={t.id ?? t.key} compact className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar fallback={t.fullName} size="sm" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{t.fullName}</div>
                        <div className="text-[11px] bp6-text-muted truncate">
                          {t.employmentStatus || "Verified skill holder"}
                        </div>
                      </div>
                    </div>
                    {t.id && (
                      <Link to={`/trainees/${t.id}`}>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </Link>
                    )}
                  </Card>
                ))}
              </CardList>
            ) : (
              <p className="text-xs bp6-text-muted py-6 text-center">
                No individual trainee records linked for this skill in current DTO data. Count
                reported: {selectedSkill?.enrolledTraineesCount ?? 0}.
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline">Close</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
