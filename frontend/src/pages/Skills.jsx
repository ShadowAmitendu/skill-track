import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { courseApi, traineeApi } from "../api/endpoints";
import { useAuth } from "../context/useAuth";
import { Award, Search, Users } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
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
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Skills Registry</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Skills grouped by category with enrolled and verified trainee counts.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skill or category..."
            className="pl-9"
          />
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" />
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Loading skills summary..." rows={4} />
      ) : isError ? (
        <ErrorState title="Failed to load skills summary" error={error} onRetry={refetch} />
      ) : Object.keys(categorizedSkills).length === 0 ? (
        <EmptyState
          icon={Award}
          title="No matching skills"
          description="Try a different keyword or category name."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(categorizedSkills).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="dark">{category}</Badge>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {items.length} {items.length === 1 ? "skill" : "skills"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((skill) => {
                  const traineeCount = skill.enrolledTraineesCount ?? skill.traineeNames?.length ?? 0;

                  const content = (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-50">{skill.skillName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{category}</p>
                        </div>
                        <div className="w-8 h-8 rounded-md bg-gray-100 border border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 flex items-center justify-center shrink-0">
                          <Award size={15} />
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400 inline-flex items-center gap-1.5">
                          <Users size={13} /> {traineeCount}{" "}
                          {traineeCount === 1 ? "trainee" : "trainees"}
                        </span>
                        {canDrillDown && (
                          <span className="font-medium text-gray-900 dark:text-gray-100">View list &rarr;</span>
                        )}
                      </div>
                    </>
                  );

                  return canDrillDown ? (
                    <button
                      key={skill.skillId || skill.skillName}
                      type="button"
                      onClick={() => setSelectedSkill(skill)}
                      className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-400 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-gray-600 dark:focus-visible:outline-gray-100"
                    >
                      {content}
                    </button>
                  ) : (
                    <div
                      key={skill.skillId || skill.skillName}
                      className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800"
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skill -> Trainees Drill-down Dialog */}
      <Dialog open={Boolean(selectedSkill)} onOpenChange={(open) => !open && setSelectedSkill(null)}>
        <DialogContent maxWidth="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award size={16} /> {selectedSkill?.skillName}
            </DialogTitle>
            <DialogDescription>
              Trainees with verified or active skill association ({selectedSkill?.category}).
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 max-h-72 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-800">
            {matchedTraineesForSkill.length > 0 ? (
              matchedTraineesForSkill.map((t) => (
                <div key={t.id ?? t.key} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar fallback={t.fullName} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-50 truncate">{t.fullName}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {t.employmentStatus || "Verified skill holder"}
                      </p>
                    </div>
                  </div>
                  {t.id && (
                    <Link to={`/trainees/${t.id}`}>
                      <Button variant="outline" size="sm">
                        Profile
                      </Button>
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 py-6 text-center">
                No individual trainee records linked for this skill in current DTO data. Count
                reported: {selectedSkill?.enrolledTraineesCount ?? 0}.
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="sm">Close</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
