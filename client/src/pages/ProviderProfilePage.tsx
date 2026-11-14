import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, H2, H4, Intent, NonIdealState, Spinner, Tag } from "@blueprintjs/core";
import { apiRequest } from "../lib/api";
import type { CourseProviderDTO } from "../types/api";

export default function ProviderProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [provider, setProvider] = useState<CourseProviderDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiRequest<{ provider: CourseProviderDTO }>(`/api/providers/${id}`)
      .then((res) => setProvider(res.provider))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load provider"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Card>
        <div className="st-row" style={{ justifyContent: "center", padding: 36 }}>
          <Spinner size={28} />
        </div>
      </Card>
    );
  }

  if (error || !provider) {
    return (
      <Card>
        <NonIdealState
          icon="office"
          title="Provider Unavailable"
          description={error || "Provider not found"}
          action={<Button icon="arrow-left" text="Back to Courses & Providers" onClick={() => navigate("/courses")} />}
        />
      </Card>
    );
  }

  return (
    <div className="st-stack">
      <div>
        <Button minimal icon="arrow-left" text="Back to Courses & Providers" onClick={() => navigate("/courses")} />
      </div>

      <Card>
        <div className="st-between">
          <div>
            <H2 style={{ margin: 0 }}>{provider.name}</H2>
            <p className="bp5-text-muted" style={{ margin: "4px 0 0 0", fontSize: 13 }}>
              {provider.contactEmail}
              {provider.website ? ` · ${provider.website}` : ""}
            </p>
          </div>
          <Tag
            intent={
              provider.approvalStatus === "approved"
                ? Intent.SUCCESS
                : provider.approvalStatus === "pending"
                  ? Intent.WARNING
                  : Intent.DANGER
            }
          >
            {provider.approvalStatus}
          </Tag>
        </div>
        {provider.description && <p style={{ marginTop: 12, marginBottom: 0 }}>{provider.description}</p>}
      </Card>

      <H4 style={{ margin: "4px 0" }}>Courses Offered ({provider.courses?.length || 0})</H4>
      {!provider.courses || provider.courses.length === 0 ? (
        <Card>
          <NonIdealState icon="book" title="No published courses" description="This provider has not created any courses yet." />
        </Card>
      ) : (
        <div className="st-grid-3">
          {provider.courses.map((c) => (
            <Card key={c.id} className="st-stack">
              <div className="st-between">
                <Tag minimal intent={Intent.PRIMARY}>
                  {c.category}
                </Tag>
                <Tag minimal>{c.popularity} enrolled</Tag>
              </div>
              <H4 style={{ margin: 0 }}>{c.title}</H4>
              <p className="bp5-text-muted" style={{ margin: 0, fontSize: 13 }}>
                {c.description}
              </p>
              <div className="st-row">
                {c.skills.map((s) => (
                  <Tag key={s.id} minimal>
                    {s.name}
                  </Tag>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
