import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Button,
  Callout,
  Card,
  H2,
  H4,
  HTMLSelect,
  InputGroup,
  Intent,
  NonIdealState,
  Spinner,
  Tag,
} from "@blueprintjs/core";
import { apiRequest } from "../lib/api";
import { showError, showSuccess } from "../lib/toaster";

interface CourseInsight {
  courseId: number;
  title: string;
  category: string;
  popularity: number;
  currentSkills: string[];
  metrics: {
    totalEnrollments: number;
    completed: number;
    dropped: number;
    kicked: number;
  };
  suggestions: string[];
}

interface ProviderSuggestionsResponse {
  providerName: string;
  courseInsights: CourseInsight[];
  executiveRecommendations: string;
  marketSourcesUsed: Array<{ slug: string; title: string; updatedAt: string }>;
  engine: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AiProviderAssistantPage() {
  const [data, setData] = useState<ProviderSuggestionsResponse | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshingDocs, setRefreshingDocs] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! Ask me about curriculum gaps in your courses, how to lower trainee drop rates, or new in-demand modules to introduce from /market-docs.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  const loadSuggestions = useCallback(async (courseId?: string) => {
    setLoading(true);
    try {
      const qs = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
      const res = await apiRequest<ProviderSuggestionsResponse>(
        `/api/ai/provider/suggestions${qs}`
      );
      setData(res);
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to load course suggestions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSuggestions();
  }, [loadSuggestions]);

  const handleRefreshMarketDocs = async () => {
    setRefreshingDocs(true);
    try {
      const res = await apiRequest<{ count: number }>("/api/ai/market-docs/refresh", {
        method: "POST",
      });
      void showSuccess(`Refreshed ${res.count} market research briefs in /market-docs`);
      await loadSuggestions(selectedCourseId || undefined);
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setRefreshingDocs(false);
    }
  };

  const sendChat = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (trimmed.length < 2) return;
    const nextHistory = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextHistory);
    setChatInput("");
    setSendingChat(true);
    try {
      const res = await apiRequest<{ reply: string }>("/api/ai/provider/chat", {
        method: "POST",
        body: JSON.stringify({ message: trimmed, history: nextHistory.slice(-8) }),
      });
      setMessages([...nextHistory, { role: "assistant", content: res.reply }]);
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Chat failed");
    } finally {
      setSendingChat(false);
    }
  };

  const handleChatSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await sendChat(chatInput);
  };

  return (
    <div className="st-stack">
      <Card>
        <div className="st-between">
          <div>
            <H2 style={{ margin: 0 }}>AI Course Suggestions & Curriculum Chatbot</H2>
            <p className="bp5-text-muted" style={{ margin: "4px 0 0 0", fontSize: 13 }}>
              Improve your courses with aggregate retention analytics and{" "}
              <code>/market-docs</code> hiring trends. Private trainee data is never exposed.
            </p>
          </div>
          <div className="st-row">
            {data && <Tag minimal>Engine: {data.engine}</Tag>}
            <Button
              icon="refresh"
              loading={refreshingDocs}
              text="Refresh Market Briefs"
              onClick={() => void handleRefreshMarketDocs()}
            />
          </div>
        </div>
      </Card>

      <div className="st-grid-2">
        <Card className="st-stack">
          <div className="st-between">
            <H4 style={{ margin: 0 }}>Course Improvement Suggestions</H4>
            {data && data.courseInsights.length > 0 && !selectedCourseId && (
              <Tag intent={Intent.PRIMARY}>{data.courseInsights.length} courses</Tag>
            )}
          </div>

          {data && (
            <HTMLSelect
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                void loadSuggestions(e.target.value || undefined);
              }}
              options={[
                { value: "", label: "All My Courses" },
                ...data.courseInsights.map((c) => ({
                  value: String(c.courseId),
                  label: c.title,
                })),
              ]}
            />
          )}

          {loading ? (
            <div className="st-row" style={{ justifyContent: "center", padding: 28 }}>
              <Spinner size={24} />
            </div>
          ) : !data || data.courseInsights.length === 0 ? (
            <NonIdealState
              icon="predictive-analysis"
              title="No courses to analyze"
              description="Create a course on Courses & Providers to see syllabus recommendations."
            />
          ) : (
            <>
              <Callout intent={Intent.PRIMARY} title="Executive Curriculum Recommendations">
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                  {data.executiveRecommendations}
                </pre>
              </Callout>

              {data.courseInsights.map((ci) => (
                <Card key={ci.courseId} compact className="st-stack">
                  <div className="st-between">
                    <strong>{ci.title}</strong>
                    <div className="st-row">
                      <Tag minimal>{ci.category}</Tag>
                      <Tag intent={Intent.SUCCESS} minimal>
                        {ci.metrics.completed} completed
                      </Tag>
                      {ci.metrics.dropped > 0 && (
                        <Tag intent={Intent.WARNING} minimal>
                          {ci.metrics.dropped} dropped
                        </Tag>
                      )}
                    </div>
                  </div>
                  <div className="st-row">
                    {ci.currentSkills.map((sk) => (
                      <Tag key={sk} minimal>
                        {sk}
                      </Tag>
                    ))}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {ci.suggestions.map((s, idx) => (
                      <li key={idx} style={{ fontSize: 13 }}>
                        {s}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </>
          )}
        </Card>

        <Card className="st-stack">
          <H4 style={{ margin: 0 }}>Provider Curriculum Chatbot</H4>
          <div className="st-row" style={{ flexWrap: "wrap", gap: 6 }}>
            <Button
              small
              minimal
              intent={Intent.PRIMARY}
              text="How can I reduce course drops?"
              onClick={() => void sendChat("How can I reduce course drops?")}
            />
            <Button
              small
              minimal
              intent={Intent.PRIMARY}
              text="What trending skills should I add next?"
              onClick={() => void sendChat("What new trending skills should I launch next?")}
            />
          </div>

          <div
            className="st-stack"
            style={{
              maxHeight: 380,
              overflowY: "auto",
              padding: 8,
              borderRadius: 4,
              border: "1px solid rgba(138,155,168,0.25)",
            }}
          >
            {messages.map((m, idx) => (
              <Callout
                key={idx}
                intent={m.role === "assistant" ? Intent.PRIMARY : Intent.NONE}
                icon={m.role === "assistant" ? "predictive-analysis" : "user"}
              >
                <div style={{ fontSize: 11 }} className="bp5-text-muted">
                  {m.role === "assistant" ? "Curriculum Assistant" : "You"}
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
              </Callout>
            ))}
          </div>

          <form onSubmit={handleChatSubmit} className="st-row">
            <InputGroup
              fill
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about syllabus updates, drop feedback, or market trends..."
            />
            <Button
              type="submit"
              intent={Intent.PRIMARY}
              icon="send-message"
              loading={sendingChat}
              disabled={chatInput.trim().length < 2}
              text="Send"
            />
          </form>
        </Card>
      </div>
    </div>
  );
}
