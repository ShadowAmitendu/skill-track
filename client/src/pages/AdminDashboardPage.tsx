import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Callout,
  Card,
  H2,
  H4,
  HTMLTable,
  Intent,
  NonIdealState,
  ProgressBar,
  Spinner,
  Tag,
} from "@blueprintjs/core";
import { DateInput3 } from "@blueprintjs/datetime2";
import { enUS } from "date-fns/locale";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiRequest } from "../lib/api";
import { showError, showSuccess } from "../lib/toaster";

interface AdminDashboardDTO {
  totalTrainees: number;
  totalCourseProviders: number;
  approvedCourseProviders: number;
  pendingCourseProviders: number;
  totalCourses: number;
  consentGivenCount: number;
  consentRevokedCount: number;
  emailsStoppedCount: number;
  followUpRespondedCount: number;
  followUpNotRespondedCount: number;
  employedCount: number;
  unemployedCount: number;
  withoutEmploymentRecord: number;
  employmentByStatus: Record<string, number>;
  unemployedReasons: Record<string, number>;
  skillsDistribution: Array<{ id: number; name: string; category: string; traineeCount: number }>;
  recentFollowUps: Array<{
    id: number;
    traineeId: number;
    traineeName: string;
    sentAt: string;
    respondedAt: string | null;
    note: string | null;
    channel: string;
  }>;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [sinceDate, setSinceDate] = useState<string | null>(null);
  const [sendingReminders, setSendingReminders] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<AdminDashboardDTO>("/api/admin/dashboard");
      setData(res);
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRunReminders = async () => {
    setSendingReminders(true);
    try {
      const res = await apiRequest<{ sentCount: number; skippedCount: number }>(
        "/api/email/run-reminders",
        { method: "POST" }
      );
      void showSuccess(
        `Quarterly reminder check finished: ${res.sentCount} sent, ${res.skippedCount} skipped`
      );
      await load();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to run email reminders");
    } finally {
      setSendingReminders(false);
    }
  };

  if (loading || !data) {
    return (
      <Card>
        <div className="st-row" style={{ justifyContent: "center", padding: 36 }}>
          <Spinner size={28} />
        </div>
      </Card>
    );
  }

  const consentRatio =
    data.totalTrainees > 0 ? data.consentGivenCount / data.totalTrainees : 0;

  const followUpChart = [
    { name: "Responded", count: data.followUpRespondedCount },
    { name: "Not Responded", count: data.followUpNotRespondedCount },
  ];

  const employmentChart = [
    { name: "Full-Time", count: data.employmentByStatus.full_time || 0 },
    { name: "Part-Time", count: data.employmentByStatus.part_time || 0 },
    { name: "Internship", count: data.employmentByStatus.internship || 0 },
    { name: "Self-Employed", count: data.employmentByStatus.self_employed || 0 },
    { name: "Unemployed", count: data.employmentByStatus.unemployed || 0 },
  ];

  const topSkills = data.skillsDistribution.slice(0, 8);

  const filteredFollowUps = sinceDate
    ? data.recentFollowUps.filter((f) => new Date(f.sentAt) >= new Date(sinceDate))
    : data.recentFollowUps;

  return (
    <div className="st-stack">
      <Card>
        <div className="st-between">
          <div>
            <H2 style={{ margin: 0 }}>Administrator Dashboard</H2>
            <p className="bp5-text-muted" style={{ margin: "4px 0 0 0", fontSize: 13 }}>
              Platform overview across trainees, consent compliance, quarterly follow-ups, employment, and skills.
            </p>
          </div>
          <div className="st-row">
            {data.pendingCourseProviders > 0 && (
              <Button
                intent={Intent.WARNING}
                icon="endorsed"
                text={`${data.pendingCourseProviders} Pending CP Approval`}
                onClick={() => navigate("/courses")}
              />
            )}
            <Button
              intent={Intent.PRIMARY}
              icon="send-message"
              loading={sendingReminders}
              text="Run Quarterly Follow-Ups Now"
              onClick={() => void handleRunReminders()}
            />
          </div>
        </div>
      </Card>

      {/* Top KPI Cards */}
      <div className="st-grid-cards">
        <Card interactive onClick={() => navigate("/trainees")}>
          <div className="bp5-text-muted" style={{ fontSize: 12 }}>Total Trainees</div>
          <H2 style={{ margin: "8px 0 4px 0" }}>{data.totalTrainees}</H2>
          <span style={{ fontSize: 12 }}>Consent active: {data.consentGivenCount}</span>
        </Card>

        <Card interactive onClick={() => navigate("/courses")}>
          <div className="bp5-text-muted" style={{ fontSize: 12 }}>Course Providers</div>
          <H2 style={{ margin: "8px 0 4px 0" }}>{data.totalCourseProviders}</H2>
          <span style={{ fontSize: 12 }}>
            {data.approvedCourseProviders} approved · {data.pendingCourseProviders} pending
          </span>
        </Card>

        <Card>
          <div className="bp5-text-muted" style={{ fontSize: 12 }}>Consent Given</div>
          <H2 style={{ margin: "8px 0 6px 0" }}>
            {data.consentGivenCount} / {data.totalTrainees}
          </H2>
          <ProgressBar intent={Intent.SUCCESS} value={consentRatio} stripes={false} animate={false} />
        </Card>

        <Card interactive onClick={() => navigate("/employment")}>
          <div className="bp5-text-muted" style={{ fontSize: 12 }}>Jobs vs Unemployed</div>
          <H2 style={{ margin: "8px 0 4px 0" }}>
            {data.employedCount} Jobs · {data.unemployedCount} No Job
          </H2>
          <span style={{ fontSize: 12 }}>
            Break: {data.unemployedReasons.break || 0} · Actively Looking:{" "}
            {data.unemployedReasons.actively_looking || 0}
          </span>
        </Card>
      </div>

      {/* Follow-up & Employment Charts */}
      <div className="st-grid-2">
        <Card>
          <H4>Follow-Up Status: Responded vs Not Responded</H4>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={followUpChart}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2d72d2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Callout intent={Intent.NONE} icon="envelope">
            Emails stopped for {data.emailsStoppedCount} trainee(s). Consent revoked by{" "}
            {data.consentRevokedCount} trainee(s).
          </Callout>
        </Card>

        <Card>
          <H4>Employment Status Breakdown</H4>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={employmentChart}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#238551" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="bp5-text-muted" style={{ margin: "8px 0 0 0", fontSize: 12 }}>
            Unemployed reasons — Career Break: {data.unemployedReasons.break || 0} · Actively
            Looking: {data.unemployedReasons.actively_looking || 0} · Removed employment record:{" "}
            {data.withoutEmploymentRecord}
          </p>
        </Card>
      </div>

      {/* Skill Distribution Chart */}
      <Card>
        <div className="st-between">
          <H4 style={{ margin: 0 }}>Skills Distribution Chart</H4>
          <Button small minimal text="View All Skills" onClick={() => navigate("/skills")} />
        </div>
        <div style={{ width: "100%", height: 250, marginTop: 12 }}>
          <ResponsiveContainer>
            <BarChart data={topSkills}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="traineeCount" fill="#7961db" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Follow-up logs with @blueprintjs/datetime2 DateInput3 filter */}
      <Card>
        <div className="st-between" style={{ marginBottom: 12 }}>
          <H4 style={{ margin: 0 }}>Recent Follow-Up Logs</H4>
          <div className="st-row">
            <span className="bp5-text-muted" style={{ fontSize: 12 }}>Filter sent after:</span>
            <DateInput3
              placeholder="YYYY-MM-DD"
              locale={enUS}
              dateFnsLocaleLoader={() => Promise.resolve(enUS)}
              value={sinceDate}
              onChange={(newDate) => setSinceDate(newDate)}
              formatDate={(date) => date.toISOString().slice(0, 10)}
              parseDate={(str) => new Date(str)}
            />
            {sinceDate && (
              <Button small minimal icon="cross" onClick={() => setSinceDate(null)} />
            )}
          </div>
        </div>
        {filteredFollowUps.length === 0 ? (
          <NonIdealState icon="envelope" title="No follow-ups match" description="Trigger quarterly reminders or clear the date filter." />
        ) : (
          <HTMLTable striped interactive style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Trainee</th>
                <th>Sent At</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {filteredFollowUps.map((f) => (
                <tr key={f.id}>
                  <td>
                    <Button
                      minimal
                      small
                      text={f.traineeName}
                      onClick={() => navigate(`/trainees/${f.traineeId}`)}
                    />
                  </td>
                  <td>{new Date(f.sentAt).toLocaleDateString()}</td>
                  <td>
                    <Tag minimal intent={f.respondedAt ? Intent.SUCCESS : Intent.WARNING}>
                      {f.respondedAt ? "Responded" : "Pending"}
                    </Tag>
                  </td>
                  <td style={{ fontSize: 12 }}>{f.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
        )}
      </Card>
    </div>
  );
}
