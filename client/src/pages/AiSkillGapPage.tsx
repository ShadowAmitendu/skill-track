import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Callout,
  Card,
  FileInput,
  FormGroup,
  H2,
  H4,
  HTMLSelect,
  InputGroup,
  Intent,
  ProgressBar,
  Spinner,
  Tag,
  TextArea,
} from "@blueprintjs/core";
import { apiRequest } from "../lib/api";
import { showError, showSuccess } from "../lib/toaster";

interface SkillGapResult {
  targetRole: string;
  readinessScore: number;
  traineeSkills: {
    verified: string[];
    detected: string[];
    freshResumeTokens: string[];
  };
  matchedRequired: string[];
  missingRequired: string[];
  missingPreferred: string[];
  recommendedCourses: Array<{
    id: number;
    title: string;
    providerName: string;
    category: string;
    popularity: number;
    coversMissingSkills: string[];
  }>;
  marketSourcesUsed: Array<{ slug: string; title: string; updatedAt: string }>;
  narrative: string;
  actionPlan: string[];
  engine: string;
}

const PRESET_ROLES = [
  "Cloud DevOps Engineer",
  "Platform Engineer",
  "Backend API Developer",
  "Full-Stack Software Engineer",
  "Data & AI Systems Engineer",
];

export default function AiSkillGapPage() {
  const navigate = useNavigate();
  const [targetRole, setTargetRole] = useState("Platform Engineer");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SkillGapResult | null>(null);

  const handleAnalyze = async (e: FormEvent) => {
    e.preventDefault();
    if (targetRole.trim().length < 2) return;
    setLoading(true);
    try {
      let res: SkillGapResult;
      if (resumeFile) {
        const fd = new FormData();
        fd.append("targetRole", targetRole.trim());
        if (resumeText.trim()) fd.append("resumeText", resumeText.trim());
        fd.append("resume", resumeFile);
        res = await apiRequest<SkillGapResult>("/api/ai/skill-gap", {
          method: "POST",
          body: fd,
        });
      } else {
        res = await apiRequest<SkillGapResult>("/api/ai/skill-gap", {
          method: "POST",
          body: JSON.stringify({
            targetRole: targetRole.trim(),
            resumeText: resumeText.trim() || undefined,
          }),
        });
      }
      setResult(res);
      void showSuccess("Skill gap analysis complete");
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Skill gap analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="st-stack">
      <Card>
        <div className="st-between">
          <div>
            <H2 style={{ margin: 0 }}>AI Skill Gap Analyzer (IT Track)</H2>
            <p className="bp5-text-muted" style={{ margin: "4px 0 0 0", fontSize: 13 }}>
              Upload a resume or scan your verified & ATS skills against a target IT role and live{" "}
              <code>/market-docs</code> briefs.
            </p>
          </div>
          {result && <Tag minimal>Engine: {result.engine}</Tag>}
        </div>
      </Card>

      <Card>
        <form onSubmit={handleAnalyze} className="st-stack">
          <div className="st-grid-2">
            <FormGroup label="Target IT Role" labelInfo="(required)">
              <InputGroup
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Platform Engineer, Backend API Developer"
                required
              />
            </FormGroup>
            <FormGroup label="Quick Role Presets">
              <HTMLSelect
                fill
                value={PRESET_ROLES.includes(targetRole) ? targetRole : ""}
                onChange={(e) => {
                  if (e.target.value) setTargetRole(e.target.value);
                }}
                options={[
                  { value: "", label: "Select a preset or type custom role..." },
                  ...PRESET_ROLES.map((r) => ({ value: r, label: r })),
                ]}
              />
            </FormGroup>
          </div>

          <FormGroup
            label="Upload Resume (.pdf, .txt, .md) — Optional"
            helperText="Uploading a resume here runs ATS skill extraction and saves tokens to your profile."
          >
            <FileInput
              fill
              text={resumeFile ? resumeFile.name : "Choose resume file (uses existing profile skills if skipped)..."}
              onInputChange={(e) => setResumeFile(e.currentTarget.files?.[0] || null)}
            />
          </FormGroup>

          <FormGroup label="Extra Experience / Resume Summary Snippet (optional)">
            <TextArea
              fill
              rows={3}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste skills or project bullet points (e.g. Built Terraform AWS VPCs and Kubernetes pipelines)..."
            />
          </FormGroup>

          <div className="st-row">
            <Button
              type="submit"
              intent={Intent.PRIMARY}
              icon="predictive-analysis"
              loading={loading}
              text="Run Skill Gap Analysis"
            />
            {resumeFile && (
              <Button minimal text="Clear File" onClick={() => setResumeFile(null)} />
            )}
          </div>
        </form>
      </Card>

      {loading && (
        <Card>
          <div className="st-row" style={{ justifyContent: "center", padding: 32 }}>
            <Spinner size={28} />
          </div>
        </Card>
      )}

      {result && !loading && (
        <div className="st-stack">
          <Card className="st-stack">
            <div className="st-between">
              <H4 style={{ margin: 0 }}>Readiness for {result.targetRole}</H4>
              <Tag
                large
                intent={
                  result.readinessScore >= 75
                    ? Intent.SUCCESS
                    : result.readinessScore >= 45
                      ? Intent.WARNING
                      : Intent.DANGER
                }
              >
                {result.readinessScore}% Core Readiness
              </Tag>
            </div>
            <ProgressBar
              intent={result.readinessScore >= 75 ? Intent.SUCCESS : Intent.PRIMARY}
              value={result.readinessScore / 100}
              stripes={false}
            />
            <Callout intent={Intent.PRIMARY}>{result.narrative}</Callout>
          </Card>

          <div className="st-grid-2">
            <Card className="st-stack">
              <H4 style={{ margin: 0 }}>Matched Competencies</H4>
              <div className="st-row">
                {result.matchedRequired.length > 0 ? (
                  result.matchedRequired.map((s) => (
                    <Tag key={s} intent={Intent.SUCCESS}>
                      {s}
                    </Tag>
                  ))
                ) : (
                  <span className="bp5-text-muted">No core competencies matched yet.</span>
                )}
              </div>
              <strong style={{ fontSize: 12 }}>Verified + ATS Skills Considered</strong>
              <div className="st-row">
                {result.traineeSkills.verified.map((s) => (
                  <Tag key={`v-${s}`} minimal intent={Intent.SUCCESS}>
                    {s} (verified)
                  </Tag>
                ))}
                {result.traineeSkills.detected.map((s) => (
                  <Tag key={`d-${s}`} minimal intent={Intent.PRIMARY}>
                    {s} (ATS)
                  </Tag>
                ))}
                {result.traineeSkills.freshResumeTokens.map((s) => (
                  <Tag key={`f-${s}`} minimal>
                    {s} (resume)
                  </Tag>
                ))}
              </div>
            </Card>

            <Card className="st-stack">
              <H4 style={{ margin: 0 }}>Identified Skill Gaps</H4>
              <div>
                <strong style={{ fontSize: 12 }}>Missing Core Requirements</strong>
                <div className="st-row" style={{ marginTop: 6 }}>
                  {result.missingRequired.length > 0 ? (
                    result.missingRequired.map((s) => (
                      <Tag key={s} intent={Intent.DANGER}>
                        {s}
                      </Tag>
                    ))
                  ) : (
                    <Tag intent={Intent.SUCCESS}>All core skills covered</Tag>
                  )}
                </div>
              </div>
              <div>
                <strong style={{ fontSize: 12 }}>Preferred Growth Areas</strong>
                <div className="st-row" style={{ marginTop: 6 }}>
                  {result.missingPreferred.length > 0 ? (
                    result.missingPreferred.map((s) => (
                      <Tag key={s} intent={Intent.WARNING} minimal>
                        {s}
                      </Tag>
                    ))
                  ) : (
                    <span className="bp5-text-muted" style={{ fontSize: 12 }}>
                      No remaining preferred gaps.
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div className="st-grid-2">
            <Card className="st-stack">
              <H4 style={{ margin: 0 }}>Recommended Action Plan</H4>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {result.actionPlan.map((step, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    {step}
                  </li>
                ))}
              </ul>
              <div style={{ fontSize: 12 }} className="bp5-text-muted">
                Market Docs Referenced: {result.marketSourcesUsed.map((m) => m.title).join(" • ")}
              </div>
            </Card>

            <Card className="st-stack">
              <div className="st-between">
                <H4 style={{ margin: 0 }}>Courses to Close Gaps</H4>
                <Button small minimal rightIcon="arrow-right" text="Browse All" onClick={() => navigate("/courses")} />
              </div>
              {result.recommendedCourses.length === 0 ? (
                <Callout intent={Intent.NONE}>No additional catalog courses needed for missing skills.</Callout>
              ) : (
                result.recommendedCourses.map((c) => (
                  <Card key={c.id} compact>
                    <div className="st-between">
                      <div>
                        <strong>{c.title}</strong>
                        <div className="bp5-text-muted" style={{ fontSize: 12 }}>
                          {c.providerName} • Covers: {c.coversMissingSkills.join(", ")}
                        </div>
                      </div>
                      <Button small text="View" onClick={() => navigate("/courses")} />
                    </div>
                  </Card>
                ))
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
