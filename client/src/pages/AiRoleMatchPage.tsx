import { useCallback, useEffect, useState } from "react";
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
import { apiRequest } from "../lib/api";
import { showError } from "../lib/toaster";

interface RoleMatchResponse {
  traineeName: string;
  verifiedSkills: string[];
  detectedSkills: string[];
  matches: Array<{
    role: string;
    category: string;
    fitScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    marketDemandTrend: string;
    evolutionSummary: string;
  }>;
  advisorSummary: string;
  marketSourcesUsed: Array<{ slug: string; title: string }>;
  engine: string;
}

export default function AiRoleMatchPage() {
  const [data, setData] = useState<RoleMatchResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<RoleMatchResponse>("/api/ai/role-match");
      setData(res);
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to compute role matches");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !data) {
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
            <H2 style={{ margin: 0 }}>AI Role Match ({data.traineeName})</H2>
            <p className="bp5-text-muted" style={{ margin: "4px 0 0 0", fontSize: 13 }}>
              Suggested IT roles scored from your verified course skills, resume ATS tokens, and market demand briefs.
            </p>
          </div>
          <div className="st-row">
            <Tag minimal>Engine: {data.engine}</Tag>
            <Button icon="refresh" text="Refresh" onClick={() => void load()} />
          </div>
        </div>
      </Card>

      <Callout intent={Intent.PRIMARY} title="AI Career Fit Summary">
        {data.advisorSummary}
      </Callout>

      <Card className="st-stack">
        <H4 style={{ margin: 0 }}>Your Current Skill Signals</H4>
        <div className="st-row">
          {data.verifiedSkills.map((s) => (
            <Tag key={`v-${s}`} intent={Intent.SUCCESS}>
              {s} (verified)
            </Tag>
          ))}
          {data.detectedSkills.map((s) => (
            <Tag key={`d-${s}`} intent={Intent.PRIMARY} minimal>
              {s} (ATS)
            </Tag>
          ))}
          {data.verifiedSkills.length === 0 && data.detectedSkills.length === 0 && (
            <span className="bp5-text-muted">
              Complete courses or upload a resume on My Profile to improve role matching accuracy.
            </span>
          )}
        </div>
      </Card>

      {data.matches.length === 0 ? (
        <NonIdealState icon="comparison" title="No IT roles evaluated" />
      ) : (
        <Card>
          <H4>Ranked IT Role Matches</H4>
          <HTMLTable striped style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Suggested Role</th>
                <th style={{ width: 170 }}>Fit Score</th>
                <th>Matched Skills</th>
                <th>Top Gaps to Close</th>
                <th>Market Outlook</th>
              </tr>
            </thead>
            <tbody>
              {data.matches.map((m) => (
                <tr key={m.role}>
                  <td>
                    <strong>{m.role}</strong>
                    <div className="bp5-text-muted" style={{ fontSize: 12 }}>
                      {m.category}
                    </div>
                  </td>
                  <td>
                    <div style={{ marginBottom: 4 }}>
                      <strong>{m.fitScore}%</strong>
                    </div>
                    <ProgressBar
                      value={m.fitScore / 100}
                      intent={
                        m.fitScore >= 70
                          ? Intent.SUCCESS
                          : m.fitScore >= 40
                            ? Intent.PRIMARY
                            : Intent.WARNING
                      }
                      stripes={false}
                    />
                  </td>
                  <td>
                    <div className="st-row">
                      {m.matchedSkills.length > 0 ? (
                        m.matchedSkills.map((s) => (
                          <Tag key={s} minimal intent={Intent.SUCCESS}>
                            {s}
                          </Tag>
                        ))
                      ) : (
                        <span className="bp5-text-muted">—</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="st-row">
                      {m.missingSkills.length > 0 ? (
                        m.missingSkills.map((s) => (
                          <Tag key={s} minimal intent={Intent.WARNING}>
                            {s}
                          </Tag>
                        ))
                      ) : (
                        <Tag intent={Intent.SUCCESS}>Ready</Tag>
                      )}
                    </div>
                  </td>
                  <td style={{ maxWidth: 280 }}>
                    <div style={{ fontSize: 12 }}>{m.marketDemandTrend}</div>
                    <div className="bp5-text-muted" style={{ fontSize: 11, marginTop: 4 }}>
                      {m.evolutionSummary}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
        </Card>
      )}
    </div>
  );
}
