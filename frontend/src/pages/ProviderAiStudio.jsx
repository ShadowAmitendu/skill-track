import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ButtonGroup, H2 } from "@blueprintjs/core";
import {
  AlertTriangle,
  BookOpen,
  Bot,
  Building2,
  FileText,
  GraduationCap,
  Lightbulb,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import { aiApi, courseApi } from "../api/endpoints";
import { useAuth } from "../context/useAuth";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Callout } from "../components/ui/Callout";
import { Card, CardList, Section, SectionCard } from "../components/ui/Card";
import { Field, Input } from "../components/ui/Field";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/QueryState";
import { Select } from "../components/ui/Select";
import { Tabs, TabsList, TabsPanel, TabsTab } from "../components/ui/Tabs";
import { useToast } from "../components/ui/useToast";
import { deriveCourseCategory } from "../utils/domain";

const QUICK_PROMPTS = [
  "Which high-demand skills should I add next quarter?",
  "Suggest a hands-on capstone project aligned with 2026 hiring.",
  "Which legacy modules in this curriculum should be refreshed?",
  "Propose a short advanced follow-on course for alumni.",
];

/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {"assistant"|"user"} sender
 * @property {string} text
 * @property {string} timestamp
 * @property {string} [courseContext]
 */

export default function ProviderAiStudio() {
  const { role, user } = useAuth();
  const { addToast } = useToast();
  const chatBottomRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  const isProvider = role === "COURSE_PROVIDER" && Number(user?.id) > 0;
  const providerId = isProvider ? Number(user.id) : 1;

  const [activeTab, setActiveTab] = useState("advisor");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [customCourseTitle, setCustomCourseTitle] = useState("");
  const [selectedDocName, setSelectedDocName] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState(
    /** @type {ChatMessage[]} */ ([
      {
        id: "welcome",
        sender: "assistant",
        text: "Hello! I am your SkillTrack Curriculum Advisor. Ask me how to modernize your syllabus, benchmark course topics against 2026 hiring research, or brainstorm new tracks.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ])
  );

  const {
    data: courses = [],
    isLoading: isCoursesLoading,
    error: coursesError,
    refetch: refetchCourses,
  } = useQuery({
    queryKey: isProvider ? ["courses", "provider", providerId] : ["courses"],
    queryFn: ({ signal }) =>
      isProvider ? courseApi.getByProvider(providerId, signal) : courseApi.getAll(signal),
  });

  const activeCourse = useMemo(() => {
    if (courses.length === 0) return null;
    return courses.find((c) => String(c.id) === String(selectedCourseId)) || courses[0];
  }, [courses, selectedCourseId]);

  const effectiveCourseTitle =
    customCourseTitle.trim() || activeCourse?.title || "Java Backend";

  const courseOptions = useMemo(
    () =>
      courses.map((course) => ({
        value: String(course.id),
        label: `${course.title} (${course.enrolledCount ?? 0} enrolled)`,
      })),
    [courses]
  );

  const suggestionsQuery = useQuery({
    queryKey: ["ai", "course-improvements", effectiveCourseTitle],
    queryFn: ({ signal }) => aiApi.suggestCourseImprovements(effectiveCourseTitle, signal),
    enabled: Boolean(effectiveCourseTitle.trim()),
  });

  const docsListQuery = useQuery({
    queryKey: ["ai", "market-research-docs"],
    queryFn: ({ signal }) => aiApi.listMarketResearchDocs(signal),
  });

  const activeDocName = useMemo(() => {
    const docs = docsListQuery.data || [];
    if (selectedDocName && docs.includes(selectedDocName)) return selectedDocName;
    return docs[0] || "";
  }, [docsListQuery.data, selectedDocName]);

  const docContentQuery = useQuery({
    queryKey: ["ai", "market-research-doc", activeDocName],
    queryFn: ({ signal }) => aiApi.readMarketResearchDoc(activeDocName, signal),
    enabled: Boolean(activeDocName),
  });

  const chatMutation = useMutation({
    mutationFn: (/** @type {string} */ promptText) =>
      aiApi.providerChatbot({
        message: promptText,
        providerId,
        courseId: activeCourse?.id,
      }),
    onSuccess: (response) => {
      const formattedTime = response.timestamp
        ? new Date(response.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: "assistant",
          text: response.reply,
          timestamp: formattedTime,
          courseContext: activeCourse?.title,
        },
      ]);
      requestAnimationFrame(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    },
    onError: (err) => {
      addToast({
        title: "Chatbot request failed",
        description: err?.message || "Unable to reach the AI curriculum assistant.",
        variant: "error",
      });
    },
  });

  const sendChatMessage = (/** @type {string} */ rawText) => {
    const text = rawText.trim();
    if (!text || chatMutation.isPending) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        courseContext: effectiveCourseTitle,
      },
    ]);
    setChatInput("");
    chatMutation.mutate(text);
    requestAnimationFrame(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const handleChatSubmit = (/** @type {import("react").FormEvent} */ e) => {
    e.preventDefault();
    sendChatMessage(chatInput);
  };

  if (isCoursesLoading) {
    return <LoadingState message="Loading Course Provider AI Studio..." rows={4} />;
  }

  if (coursesError) {
    return (
      <ErrorState
        title="Unable to load provider catalog"
        error={coursesError}
        onRetry={() => refetchCourses()}
      />
    );
  }

  const advice = suggestionsQuery.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Sparkles size={18} className="text-blue-500 shrink-0" />
              <H2 className="!mb-0">Course Provider AI Studio</H2>
              <Badge variant="primary">Curriculum &amp; Market AI</Badge>
              {role === "ADMIN" && <Badge variant="outline">Admin Preview</Badge>}
            </div>
            <p className="text-sm bp6-text-muted">
              Benchmark your courses against SkillTrack market research, spot outdated syllabus
              topics, chat with the Curriculum Advisor, and read market intelligence briefs.
            </p>
          </div>

          <ButtonGroup>
            {isProvider && (
              <Link to={`/providers/${providerId}`}>
                <Button variant="outline" icon={<Building2 size={14} />}>
                  Provider Profile
                </Button>
              </Link>
            )}
            <Link to={isProvider ? `/courses?provider=${providerId}` : "/courses"}>
              <Button variant="outline" icon={<GraduationCap size={14} />}>
                Manage Courses
              </Button>
            </Link>
          </ButtonGroup>
        </div>

        {/* Shared Course Context Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4 pt-4 border-t border-black/10 dark:border-white/10">
          <div className="md:col-span-5">
            <Field label="Select Existing Course" id="provider-course-select" className="!mb-0">
              <Select
                value={activeCourse ? String(activeCourse.id) : ""}
                onValueChange={(val) => {
                  setSelectedCourseId(String(val));
                  setCustomCourseTitle("");
                }}
                options={courseOptions}
                placeholder={
                  courses.length > 0 ? "Choose a course..." : "No courses owned yet"
                }
                disabled={courses.length === 0}
              />
            </Field>
          </div>

          <div className="md:col-span-5">
            <Field
              label="Or Benchmark Custom Course Title"
              id="custom-course-title"
              className="!mb-0"
            >
              <Input
                id="custom-course-title"
                value={customCourseTitle}
                onChange={(/** @type {any} */ e) => setCustomCourseTitle(e.target.value)}
                placeholder={`Using: ${activeCourse?.title || "Java Backend"}`}
              />
            </Field>
          </div>

          <div className="md:col-span-2 flex items-end">
            <Button
              variant="outline"
              fill
              icon={<RefreshCw size={14} />}
              loading={suggestionsQuery.isFetching}
              onClick={() => suggestionsQuery.refetch()}
            >
              Refresh AI
            </Button>
          </div>
        </div>
      </Card>

      {/* Studio Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} large>
          <TabsList>
            <TabsTab value="advisor">
              <span className="inline-flex items-center gap-1.5">
                <Lightbulb size={14} />
                <span>Course Improvement Advisor</span>
              </span>
            </TabsTab>
            <TabsTab value="chatbot">
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare size={14} />
                <span>AI Curriculum Chatbot</span>
              </span>
            </TabsTab>
            <TabsTab value="research">
              <span className="inline-flex items-center gap-1.5">
                <FileText size={14} />
                <span>Market Research Briefs</span>
              </span>
            </TabsTab>
          </TabsList>

          {/* TAB 1: Course Improvement Advisor */}
          <TabsPanel value="advisor" className="pt-4 space-y-5">
            {activeCourse && !customCourseTitle.trim() && (
              <Card compact className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{activeCourse.title}</span>
                    <Badge variant="outline">
                      {deriveCourseCategory(activeCourse.skillsTaught, activeCourse.category)}
                    </Badge>
                    <Badge variant="primary">
                      {activeCourse.enrolledCount ?? 0} trainees enrolled
                    </Badge>
                  </div>
                  <p className="text-xs bp6-text-muted mb-0">{activeCourse.description}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(activeCourse.skillsTaught || []).map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {suggestionsQuery.isLoading ? (
              <LoadingState message={`Auditing curriculum for "${effectiveCourseTitle}"...`} rows={4} />
            ) : suggestionsQuery.error ? (
              <ErrorState
                title="Unable to generate course recommendations"
                error={suggestionsQuery.error}
                onRetry={() => suggestionsQuery.refetch()}
              />
            ) : advice ? (
              <>
                <Callout
                  variant="info"
                  icon={<Sparkles size={16} />}
                  title={`Market Rationale — ${advice.currentCourseTitle}`}
                >
                  {advice.marketRationale}
                </Callout>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Section
                    title="Suggested Curriculum Additions"
                    subtitle="High-growth skills to weave into modules"
                    icon={<PlusCircle size={14} />}
                  >
                    <SectionCard>
                      {(advice.suggestedCurriculumAdditions || []).length > 0 ? (
                        <ul className="space-y-2 mb-0 list-none p-0">
                          {advice.suggestedCurriculumAdditions.map((topic) => (
                            <li key={topic} className="flex items-start gap-2 text-sm">
                              <Badge variant="emerald">Add</Badge>
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs bp6-text-muted mb-0">
                          No urgent additions detected for this course title.
                        </p>
                      )}
                    </SectionCard>
                  </Section>

                  <Section
                    title="Outdated Topics to Refresh"
                    subtitle="Legacy areas losing employer demand"
                    icon={<AlertTriangle size={14} />}
                  >
                    <SectionCard>
                      {(advice.outdatedTopicsToRemove || []).length > 0 ? (
                        <ul className="space-y-2 mb-0 list-none p-0">
                          {advice.outdatedTopicsToRemove.map((topic) => (
                            <li key={topic} className="flex items-start gap-2 text-sm">
                              <Badge variant="amber">Retire</Badge>
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs bp6-text-muted mb-0">
                          No obsolete syllabus modules flagged.
                        </p>
                      )}
                    </SectionCard>
                  </Section>
                </div>

                <Section
                  title="New Course Spin-Off Ideas"
                  subtitle="Next-step offerings matched to market research documents"
                  icon={<BookOpen size={14} />}
                >
                  <SectionCard>
                    {(advice.newCourseIdeas || []).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {advice.newCourseIdeas.map((idea) => (
                          <Card
                            key={idea}
                            compact
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="text-sm font-medium">{idea}</div>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<MessageSquare size={14} />}
                              onClick={() => {
                                setActiveTab("chatbot");
                                sendChatMessage(
                                  `Draft a 4-module syllabus outline for a new course titled "${idea}" aimed at our ${effectiveCourseTitle} graduates.`
                                );
                              }}
                            >
                              Draft with AI
                            </Button>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs bp6-text-muted mb-0">No spin-off ideas returned.</p>
                    )}
                  </SectionCard>
                </Section>
              </>
            ) : null}
          </TabsPanel>

          {/* TAB 2: AI Curriculum Chatbot */}
          <TabsPanel value="chatbot" className="pt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium bp6-text-muted">Quick prompts:</span>
              {QUICK_PROMPTS.map((prompt) => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  disabled={chatMutation.isPending}
                  onClick={() => sendChatMessage(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>

            <Section
              title="Curriculum Advisor Session"
              subtitle={`Scoped to provider #${providerId}${activeCourse ? ` • Course: ${activeCourse.title}` : ""}`}
              icon={<Bot size={15} />}
            >
              <SectionCard className="space-y-4">
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {messages.map((msg) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <Card
                          compact
                          className={`max-w-[85%] space-y-1 ${
                            isUser ? "border border-blue-500/40" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-xs bp6-text-muted">
                            <span className="inline-flex items-center gap-1.5 font-semibold">
                              {isUser ? (
                                <span>{user?.name || "Course Provider"}</span>
                              ) : (
                                <>
                                  <Bot size={13} className="text-blue-500" />
                                  <span>SkillTrack AI Advisor</span>
                                </>
                              )}
                            </span>
                            <span>{msg.timestamp}</span>
                          </div>
                          <div className="text-sm whitespace-pre-wrap leading-relaxed">
                            {msg.text}
                          </div>
                        </Card>
                      </div>
                    );
                  })}

                  {chatMutation.isPending && (
                    <div className="flex justify-start">
                      <Card compact>
                        <span className="text-xs bp6-text-muted">
                          Advisor is analyzing market docs and crafting recommendations...
                        </span>
                      </Card>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                <form onSubmit={handleChatSubmit} className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-black/10 dark:border-white/10">
                  <div className="flex-1">
                    <Input
                      id="provider-chat-input"
                      value={chatInput}
                      disabled={chatMutation.isPending}
                      onChange={(/** @type {any} */ e) => setChatInput(e.target.value)}
                      placeholder="Ask about syllabus updates, trainee skill demand, projects, or course structure..."
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    icon={<Send size={14} />}
                    loading={chatMutation.isPending}
                    disabled={!chatInput.trim()}
                  >
                    Send
                  </Button>
                </form>
              </SectionCard>
            </Section>
          </TabsPanel>

          {/* TAB 3: Market Research Briefs */}
          <TabsPanel value="research" className="pt-4">
            {docsListQuery.isLoading ? (
              <LoadingState message="Loading market research library..." rows={3} />
            ) : docsListQuery.error ? (
              <ErrorState
                title="Unable to load market research docs"
                error={docsListQuery.error}
                onRetry={() => docsListQuery.refetch()}
              />
            ) : (docsListQuery.data || []).length === 0 ? (
              <EmptyState
                icon="document"
                title="No market research documents available"
                description="Market briefs will appear here after the weekly research job runs."
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4">
                  <Section
                    title="Research Library"
                    subtitle="Weekly industry intelligence briefs"
                    icon={<FileText size={14} />}
                  >
                    <CardList bordered>
                      {(docsListQuery.data || []).map((docName) => {
                        const isSelected = docName === activeDocName;
                        return (
                          <Card
                            key={docName}
                            compact
                            interactive
                            selected={isSelected}
                            onClick={() => setSelectedDocName(docName)}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="text-sm font-medium truncate">{docName}</span>
                            {isSelected && <Badge variant="primary">Active</Badge>}
                          </Card>
                        );
                      })}
                    </CardList>
                  </Section>
                </div>

                <div className="lg:col-span-8">
                  <Section
                    title={activeDocName || "Document Viewer"}
                    icon={<BookOpen size={14} />}
                    rightElement={
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<RefreshCw size={14} />}
                        loading={docContentQuery.isFetching}
                        onClick={() => docContentQuery.refetch()}
                      >
                        Reload
                      </Button>
                    }
                  >
                    <SectionCard>
                      {docContentQuery.isLoading ? (
                        <LoadingState message={`Loading ${activeDocName}...`} rows={3} />
                      ) : docContentQuery.error ? (
                        <ErrorState
                          title="Failed to open document"
                          error={docContentQuery.error}
                          onRetry={() => docContentQuery.refetch()}
                        />
                      ) : (
                        <pre className="text-xs sm:text-sm whitespace-pre-wrap font-sans leading-relaxed m-0">
                          {docContentQuery.data}
                        </pre>
                      )}
                    </SectionCard>
                  </Section>
                </div>
              </div>
            )}
          </TabsPanel>
        </Tabs>
      </Card>
    </div>
  );
}
