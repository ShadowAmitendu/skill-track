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
  MailCheck,
  CheckCircle2,
  Clock,
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
import { Card, Section, SectionCard, CardList } from "../ui/Card";
import { EntityTitle, H2, Icon, Intent } from "@blueprintjs/core";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Progress } from "../ui/Progress";
import { LoadingState, ErrorState } from "../ui/QueryState";
import {
  EMPLOYMENT_STATUS_OPTIONS,
  hasTraineeRespondedFollowUp,
  normalizeEmploymentStatus,
} from "../../utils/domain";
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
    const consented =
      trainees.length > 0
        ? trainees.filter((t) => t.consentGiven).length
        : dashboard?.totalConsents ?? 0;
    const total = trainees.length || dashboard?.totalTrainees || 0;
    const pending = Math.max(0, total - consented);
    const emailsAllowed = trainees.filter((t) => t.allowEmails && !t.adminStoppedEmail).length;
    const haltedByAdmin = trainees.filter((t) => t.adminStoppedEmail).length;
    return {
      count: consented,
      pending,
      emailsAllowed,
      haltedByAdmin,
      percentage: total === 0 ? 0 : Math.round((consented / total) * 100),
    };
  }, [trainees, dashboard]);

  const followUpMetrics = useMemo(() => {
    const responded =
      trainees.length > 0
        ? trainees.filter((t) => hasTraineeRespondedFollowUp(t)).length
        : dashboard?.followUpRespondedCount ?? 0;
    const total = trainees.length || dashboard?.totalTrainees || 0;
    const notResponded =
      trainees.length > 0
        ? trainees.length - responded
        : dashboard?.followUpNotRespondedCount ?? Math.max(0, total - responded);
    const rate = total === 0 ? 0 : Math.round((responded / total) * 100);
    return {
      responded,
      notResponded,
      rate,
      chartData: [
        {
          name: "Responded",
          count: responded,
          color: isDark ? "#32a467" : "#238551",
        },
        {
          name: "Not Responded",
          count: notResponded,
          color: isDark ? "#ec9a3c" : "#d9822b",
        },
      ],
    };
  }, [trainees, dashboard, isDark]);

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

  const employmentCounts = useMemo(() => {
    const counts = {
      FULL_TIME: 0,
      PART_TIME: 0,
      INTERNSHIP: 0,
      SELF_EMPLOYED: 0,
      UNEMPLOYED: 0,
    };
    trainees.forEach((t) => {
      const normalized = normalizeEmploymentStatus(t.employmentStatus);
      counts[normalized] = (counts[normalized] || 0) + 1;
    });
    return counts;
  }, [trainees]);

  const employmentChartData = useMemo(() => {
    const colors = {
      FULL_TIME: isDark ? "#32a467" : "#238551",
      PART_TIME: isDark ? "#4c90f0" : "#2d72d2",
      INTERNSHIP: isDark ? "#ec9a3c" : "#c87619",
      SELF_EMPLOYED: isDark ? "#2ee6d6" : "#008075",
      UNEMPLOYED: isDark ? "#e76a6e" : "#cd4246",
    };
    return EMPLOYMENT_STATUS_OPTIONS.map((opt) => ({
      key: opt.value,
      name: opt.label,
      count: employmentCounts[opt.value] || 0,
      color: colors[opt.value],
    }));
  }, [employmentCounts, isDark]);

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
          <H2 className="!mb-0">Administrator Dashboard</H2>
          <p className="bp6-text-muted text-xs mt-1">
            Cohort totals, tracking consent, skills distribution, and quarterly reminder dispatch.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Send size={14} />}
          onClick={() => setReminderModalOpen(true)}
        >
          Trigger Quarterly Reminders
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/trainees" className="block">
          <Card interactive className="h-full">
            <EntityTitle
              icon={<Users size={18} className="bp6-text-muted" />}
              title="Total Trainees"
              subtitle="View directory →"
            />
            <H2 className="!mb-0 !mt-3 tabular-nums">
              {dashboard?.totalTrainees ?? trainees.length}
            </H2>
          </Card>
        </Link>

        <Link to="/courses?tab=providers" className="block">
          <Card interactive className="h-full">
            <EntityTitle
              icon={<Building2 size={18} className="bp6-text-muted" />}
              title="Course Providers"
              subtitle="View providers →"
            />
            <H2 className="!mb-0 !mt-3 tabular-nums">
              {dashboard?.totalCourseProviders ?? 0}
            </H2>
          </Card>
        </Link>

        <Link to="/courses?tab=courses" className="block">
          <Card interactive className="h-full">
            <EntityTitle
              icon={<GraduationCap size={18} className="bp6-text-muted" />}
              title="Accredited Courses"
              subtitle="Browse courses →"
            />
            <H2 className="!mb-0 !mt-3 tabular-nums">
              {dashboard?.totalCourses ?? 0}
            </H2>
          </Card>
        </Link>

        <Link to="/trainees?consent=true" className="block">
          <Card interactive className="h-full">
            <EntityTitle
              icon={<ShieldCheck size={18} className="bp6-text-muted" />}
              title="Total Consents"
              subtitle={`${consentMetrics.percentage}% of ${trainees.length} trainees consented →`}
            />
            <div className="mt-3 space-y-2">
              <H2 className="!mb-0 tabular-nums">{consentMetrics.count}</H2>
              <Progress value={consentMetrics.percentage} variant="success" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Consent & Follow-Up Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section
          title="Consent Given & Outreach Status"
          icon={<ShieldCheck size={16} />}
          rightElement={
            <Link to="/trainees?consent=true">
              <Button variant="minimal" size="sm" endIcon={<Icon icon="arrow-right" size={12} />}>
                View Consented
              </Button>
            </Link>
          }
        >
          <SectionCard className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="bp6-text-muted">Tracking Consent Share</span>
              <span className="font-semibold tabular-nums">
                {consentMetrics.count} / {trainees.length} ({consentMetrics.percentage}%)
              </span>
            </div>
            <Progress value={consentMetrics.percentage} variant="success" />
            <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
              <Link to="/trainees?consent=true" className="block">
                <span className="bp6-text-muted block">Consent Given</span>
                <span className="font-semibold tabular-nums text-sm text-[#238551] dark:text-[#72ca9b]">
                  {consentMetrics.count}
                </span>
              </Link>
              <Link to="/trainees?consent=false" className="block">
                <span className="bp6-text-muted block">Pending Consent</span>
                <span className="font-semibold tabular-nums text-sm">
                  {consentMetrics.pending}
                </span>
              </Link>
              <div className="block">
                <span className="bp6-text-muted block">Emails Enabled</span>
                <span className="font-semibold tabular-nums text-sm">
                  {consentMetrics.emailsAllowed}
                </span>
              </div>
            </div>
          </SectionCard>
        </Section>

        <Section
          title="Follow-Up Status: Responded vs Not Responded"
          icon={<MailCheck size={16} />}
          rightElement={
            <Link to="/trainees">
              <Button variant="minimal" size="sm" endIcon={<Icon icon="arrow-right" size={12} />}>
                Follow-Up List
              </Button>
            </Link>
          }
        >
          <SectionCard>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={followUpMetrics.chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 20, left: 20, bottom: 4 }}
                >
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: isDark ? "#abb3bf" : "#5f6b7c", fontSize: 11 }}
                    stroke={isDark ? "#404854" : "#dce0e5"}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fill: isDark ? "#f6f7f9" : "#1c2127", fontSize: 11 }}
                    stroke={isDark ? "#404854" : "#dce0e5"}
                  />
                  <RechartsTooltip
                    cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                    contentStyle={{
                      backgroundColor: isDark ? "#252a31" : "#ffffff",
                      borderColor: isDark ? "#404854" : "#dce0e5",
                      borderRadius: "4px",
                      fontSize: "12px",
                      color: isDark ? "#f6f7f9" : "#1c2127",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 2, 2, 0]} isAnimationActive={false}>
                    {followUpMetrics.chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
          <SectionCard compact className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CheckCircle2 size={13} className="text-[#238551] dark:text-[#72ca9b]" />
              Responded: <strong className="tabular-nums">{followUpMetrics.responded}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Clock size={13} className="text-[#c87619] dark:text-[#ec9a3c]" />
              Not Responded: <strong className="tabular-nums">{followUpMetrics.notResponded}</strong>
            </span>
            <Badge variant="outline">Response Rate: {followUpMetrics.rate}%</Badge>
          </SectionCard>
        </Section>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section
          title="Employment Breakdown"
          icon={<BriefcaseBusiness size={16} />}
          rightElement={
            <Link to="/employment">
              <Button variant="minimal" size="sm" endIcon={<Icon icon="arrow-right" size={12} />}>
                Employment
              </Button>
            </Link>
          }
        >
          <SectionCard>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employmentChartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: isDark ? "#abb3bf" : "#5f6b7c" }}
                    stroke={isDark ? "#404854" : "#dce0e5"}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: isDark ? "#abb3bf" : "#5f6b7c" }}
                    stroke={isDark ? "#404854" : "#dce0e5"}
                  />
                  <RechartsTooltip
                    cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                    contentStyle={{
                      backgroundColor: isDark ? "#252a31" : "#ffffff",
                      borderColor: isDark ? "#404854" : "#dce0e5",
                      color: isDark ? "#f6f7f9" : "#1c2127",
                      borderRadius: "4px",
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
          </SectionCard>
          <SectionCard compact className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
              <Link key={opt.value} to={`/employment?status=${opt.value}`} className="block">
                <span className="bp6-text-muted block truncate">{opt.label}</span>
                <span className="font-semibold tabular-nums text-sm">
                  {employmentCounts[opt.value] || 0}
                </span>
              </Link>
            ))}
          </SectionCard>
        </Section>

        <Section
          title="Top Skills Distribution"
          icon={<Award size={16} />}
          rightElement={
            <Link to="/skills">
              <Button variant="minimal" size="sm" endIcon={<Icon icon="arrow-right" size={12} />}>
                View Skills
              </Button>
            </Link>
          }
        >
          <SectionCard>
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
                    tick={{ fontSize: 12, fill: isDark ? "#abb3bf" : "#5f6b7c" }}
                    stroke={isDark ? "#404854" : "#dce0e5"}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: isDark ? "#f6f7f9" : "#1c2127" }}
                    stroke={isDark ? "#404854" : "#dce0e5"}
                    width={90}
                  />
                  <RechartsTooltip
                    cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                    contentStyle={{
                      backgroundColor: isDark ? "#252a31" : "#ffffff",
                      borderColor: isDark ? "#404854" : "#dce0e5",
                      color: isDark ? "#f6f7f9" : "#1c2127",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="trainees"
                    fill={isDark ? "#4c90f0" : "#2d72d2"}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
          <SectionCard compact className="text-xs bp6-text-muted">
            Computed from course enrollments and verified completions.
          </SectionCard>
        </Section>
      </div>

      {/* Unemployed Reasons */}
      {dashboard?.unemployedReasonsBreakdown &&
        Object.keys(dashboard.unemployedReasonsBreakdown).length > 0 && (
          <Section
            title="Reported Non-Placement Reasons"
            icon={<AlertCircle size={16} />}
          >
            <SectionCard padded={false}>
              <CardList bordered={false}>
                {Object.entries(dashboard.unemployedReasonsBreakdown).map(([reason, count]) => (
                  <Card key={reason} compact className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium">{reason}</span>
                    <Badge variant="outline" className="shrink-0">
                      {count} {count === 1 ? "trainee" : "trainees"}
                    </Badge>
                  </Card>
                ))}
              </CardList>
            </SectionCard>
          </Section>
        )}

      {/* Trigger Quarterly Reminders AlertDialog */}
      <AlertDialog open={reminderModalOpen} onOpenChange={setReminderModalOpen}>
        <AlertDialogContent variant="info" icon="send-message">
          <AlertDialogHeader>
            <AlertDialogTitle>Send Quarterly Update Reminders?</AlertDialogTitle>
            <AlertDialogDescription>
              Calls POST /api/v1/email/trigger-quarterly-reminders to dispatch status check emails
              to eligible trainees who granted consent and allowed email notifications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button
              variant="primary"
              intent={Intent.PRIMARY}
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
