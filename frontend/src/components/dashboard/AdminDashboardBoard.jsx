import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { adminApi, traineeApi, courseApi, emailApi } from "../../api/endpoints";
import { useToast } from "../ui/useToast";
import { useTheme } from "../../context/useTheme";
import {
  Users,
  GraduationCap,
  Building2,
  BriefcaseBusiness,
  ShieldCheck,
  Send,
  AlertCircle,
  Award,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Progress } from "../ui/Progress";
import { LoadingState, ErrorState } from "../ui/QueryState";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from "../ui/AlertDialog";

export function AdminDashboardBoard() {
  const { addToast } = useToast();
  const { isDark } = useTheme();
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isError: dashboardError,
    error: dashboardErrObj,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: ({ signal }) => adminApi.getDashboard(signal),
    staleTime: 60000,
  });

  const { data: trainees = [] } = useQuery({
    queryKey: ["trainees"],
    queryFn: ({ signal }) => traineeApi.getAll(signal),
    staleTime: 60000,
  });

  const { data: skillsSummary = [] } = useQuery({
    queryKey: ["skillsSummary"],
    queryFn: ({ signal }) => courseApi.getSkillsSummary(signal),
    staleTime: 60000,
  });

  const consentMetrics = useMemo(() => {
    if (trainees.length === 0) return { count: 0, percentage: 0 };
    const consented = trainees.filter((t) => t.consentGiven).length;
    return {
      count: consented,
      percentage: Math.round((consented / trainees.length) * 100),
    };
  }, [trainees]);

  const reminderMutation = useMutation({
    mutationFn: () => emailApi.triggerQuarterlyReminders(),
    onSuccess: (res) => {
      addToast({
        title: "Reminders Triggered",
        description:
          typeof res === "string"
            ? res
            : "Quarterly reminder emails sent to consented trainees.",
      });
      setReminderModalOpen(false);
    },
    onError: (err) => {
      addToast({ title: "Dispatch Failed", description: err.message, variant: "danger" });
    },
  });

  const employmentChartData = useMemo(() => {
    if (!dashboard) return [];
    return [
      {
        name: "Employed",
        count: dashboard.employedStudentsCount || 0,
        color: isDark ? "#F9FAFB" : "#111827",
      },
      {
        name: "Seeking",
        count: dashboard.jobSeekingStudentsCount || 0,
        color: isDark ? "#9CA3AF" : "#4B5563",
      },
      {
        name: "Unemployed",
        count: dashboard.unemployedStudentsCount || 0,
        color: isDark ? "#6B7280" : "#9CA3AF",
      },
    ];
  }, [dashboard, isDark]);

  const topSkillsData = useMemo(() => {
    return [...skillsSummary]
      .sort((a, b) => (b.enrolledTraineesCount || 0) - (a.enrolledTraineesCount || 0))
      .slice(0, 5)
      .map((s) => ({
        name: s.skillName,
        trainees: s.enrolledTraineesCount ?? s.traineeNames?.length ?? 0,
      }));
  }, [skillsSummary]);

  if (dashboardLoading) {
    return <LoadingState label="Loading admin overview..." rows={4} />;
  }

  if (dashboardError) {
    return (
      <ErrorState
        title="Failed to load dashboard overview"
        error={dashboardErrObj}
        onRetry={refetchDashboard}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Administrator Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Cohort totals, tracking consent, skills distribution, and quarterly reminder dispatch.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setReminderModalOpen(true)}>
          <Send size={14} /> Trigger Quarterly Reminders
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/trainees" className="group block">
          <Card className="group-hover:border-gray-400 dark:group-hover:border-gray-600 h-full">
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Total Trainees
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mt-1 tabular-nums">
                  {dashboard?.totalTrainees ?? trainees.length}
                </p>
                <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:underline mt-1 inline-block">
                  View directory &rarr;
                </span>
              </div>
              <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 flex items-center justify-center shrink-0">
                <Users size={18} />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/courses?tab=providers" className="group block">
          <Card className="group-hover:border-gray-400 dark:group-hover:border-gray-600 h-full">
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Course Providers
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mt-1 tabular-nums">
                  {dashboard?.totalCourseProviders ?? 0}
                </p>
                <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:underline mt-1 inline-block">
                  View providers &rarr;
                </span>
              </div>
              <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 flex items-center justify-center shrink-0">
                <Building2 size={18} />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/courses?tab=courses" className="group block">
          <Card className="group-hover:border-gray-400 dark:group-hover:border-gray-600 h-full">
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Accredited Courses
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mt-1 tabular-nums">
                  {dashboard?.totalCourses ?? 0}
                </p>
                <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:underline mt-1 inline-block">
                  Browse courses &rarr;
                </span>
              </div>
              <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 flex items-center justify-center shrink-0">
                <GraduationCap size={18} />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/trainees?consent=true" className="group block">
          <Card className="group-hover:border-gray-400 dark:group-hover:border-gray-600 h-full">
            <CardContent className="p-5 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Consent Granted
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mt-1 tabular-nums">
                    {consentMetrics.percentage}%
                  </p>
                </div>
                <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
              </div>
              <Progress value={consentMetrics.percentage} />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {consentMetrics.count} of {trainees.length} trainees consented &rarr;
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BriefcaseBusiness size={16} /> Employment Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employmentChartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: isDark ? "#9CA3AF" : "#4B5563" }}
                    stroke={isDark ? "#374151" : "#E5E7EB"}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: isDark ? "#9CA3AF" : "#4B5563" }}
                    stroke={isDark ? "#374151" : "#E5E7EB"}
                  />
                  <RechartsTooltip
                    cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                    contentStyle={{
                      backgroundColor: isDark ? "#111827" : "#FFFFFF",
                      borderColor: isDark ? "#1F2937" : "#E5E7EB",
                      color: isDark ? "#F9FAFB" : "#111827",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {employmentChartData.map((entry, index) => (
                      <Cell key={`emp-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-800 text-center text-xs">
              <Link
                to="/employment?status=EMPLOYED"
                className="hover:bg-gray-50 dark:hover:bg-gray-800/70 rounded-md py-1"
              >
                <span className="text-gray-500 dark:text-gray-400 block">Employed</span>
                <span className="font-semibold text-gray-900 dark:text-gray-50 tabular-nums">
                  {dashboard?.employedStudentsCount || 0}
                </span>
              </Link>
              <Link
                to="/employment?status=SEEKING"
                className="hover:bg-gray-50 dark:hover:bg-gray-800/70 rounded-md py-1"
              >
                <span className="text-gray-500 dark:text-gray-400 block">Seeking</span>
                <span className="font-semibold text-gray-900 dark:text-gray-50 tabular-nums">
                  {dashboard?.jobSeekingStudentsCount || 0}
                </span>
              </Link>
              <Link
                to="/employment?status=UNEMPLOYED"
                className="hover:bg-gray-50 dark:hover:bg-gray-800/70 rounded-md py-1"
              >
                <span className="text-gray-500 dark:text-gray-400 block">Unemployed</span>
                <span className="font-semibold text-gray-900 dark:text-gray-50 tabular-nums">
                  {dashboard?.unemployedStudentsCount || 0}
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award size={16} /> Top Skills Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topSkillsData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: isDark ? "#9CA3AF" : "#4B5563" }}
                    stroke={isDark ? "#374151" : "#E5E7EB"}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: isDark ? "#F3F4F6" : "#111827" }}
                    stroke={isDark ? "#374151" : "#E5E7EB"}
                    width={90}
                  />
                  <RechartsTooltip
                    cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                    contentStyle={{
                      backgroundColor: isDark ? "#111827" : "#FFFFFF",
                      borderColor: isDark ? "#1F2937" : "#E5E7EB",
                      color: isDark ? "#F9FAFB" : "#111827",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="trainees"
                    fill={isDark ? "#E5E7EB" : "#111827"}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-4 pt-3 border-t border-gray-200 dark:border-gray-800">
              <span>Computed from course enrollments and verified completions.</span>
              <Link
                to="/skills"
                className="font-medium text-gray-900 underline hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-300"
              >
                View Skills &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unemployed Reasons */}
      {dashboard?.unemployedReasonsBreakdown &&
        Object.keys(dashboard.unemployedReasonsBreakdown).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle size={16} /> Reported Non-Placement Reasons
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(dashboard.unemployedReasonsBreakdown).map(([reason, count]) => (
                <div
                  key={reason}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-between gap-3 text-xs dark:bg-gray-950/70 dark:border-gray-800"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">{reason}</span>
                  <Badge variant="outline" className="shrink-0">
                    {count} {count === 1 ? "trainee" : "trainees"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

      {/* Trigger Quarterly Reminders AlertDialog */}
      <AlertDialog open={reminderModalOpen} onOpenChange={setReminderModalOpen}>
        <AlertDialogContent variant="info">
          <AlertDialogHeader>
            <AlertDialogTitle>Send Quarterly Update Reminders?</AlertDialogTitle>
            <AlertDialogDescription>
              Calls POST /api/v1/email/trigger-quarterly-reminders to dispatch status check emails
              to eligible trainees who granted consent and allowed email notifications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
            <Button
              variant="primary"
              size="sm"
              loading={reminderMutation.isPending}
              onClick={() => reminderMutation.mutate()}
            >
              Confirm Dispatch
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
