import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FileText,
  Lock,
  PlusCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Clock,
  Send,
  MoreVertical,
  ThumbsUp,
  MessageCircle,
} from "lucide-react";
import { TopAppBar } from "../TopAppBar";
import { DocsOnlyBanner } from "../shared/DocsOnlyBanner";
import { DocumentListRow } from "../shared/DocumentListRow";
import { MobileToast } from "../shared/MobileToast";
import {
  SHARED_COURSES_DATA,
  EXPLORE_CATALOG_COURSES,
  type ExtendedCourseData,
  type MobileDiscussionPost,
} from "../data/courses.data";
import { ChatConversationScreen } from "./ChatConversationScreen";
import anatomyImage from "../../../Assets/course-library/human-anatomy.webp";

export const CourseOverviewScreen: React.FC = () => {
  const navigate = useNavigate();
  const { slug = "human-anatomy-i" } = useParams<{ slug?: string }>();

  // Find course from enrolled or explore list
  const enrolledCourse = SHARED_COURSES_DATA.find((c) => c.slug === slug);
  const exploreCourse = EXPLORE_CATALOG_COURSES.find((c) => c.slug === slug);
  const course: ExtendedCourseData =
    enrolledCourse ||
    exploreCourse || {
      id: `course-${slug}`,
      title: slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      subtitle: "Medical Curriculum Study Series",
      status: "IN PROGRESS",
      imageSrc: anatomyImage,
      completedDocs: 4,
      totalDocs: 12,
      opened: "Recently",
      slug,
      isEnrolled: Boolean(enrolledCourse),
      instructor: {
        id: "u_ahmed",
        name: "Dr. Ahmed Hassan",
        title: "Professor of Anatomy",
        credentials: "MD, PhD",
        bioSnippet: "Clinical anatomy and morphological sciences faculty.",
        initials: "AH",
        conversationId: "c1",
      },
      modules: [],
      resources: [],
      discussionPosts: [],
    };

  const isEnrolled = course.isEnrolled;

  // Local state for tabs, accordion, discussion, toast
  const [activeTab, setActiveTab] = useState<"syllabus" | "resources" | "discussion">("syllabus");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    m1: true,
    m2: false,
    "hb-m1": true,
    "cp-m1": true,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeSubScreen, setActiveSubScreen] = useState<{
    type: "doc" | "chat";
    title: string;
  } | null>(null);
  const [discussionPosts, setDiscussionPosts] = useState<MobileDiscussionPost[]>(
    course.discussionPosts || []
  );
  const [replyText, setReplyText] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  // Open Document Reader stub (matching Continue Reading on Home)
  const handleOpenDocumentReader = (docTitle: string) => {
    setActiveSubScreen({ type: "doc", title: docTitle });
  };

  // Message Instructor Action -> opens ChatConversationScreen
  const handleMessageInstructor = () => {
    setActiveSubScreen({ type: "chat", title: course.instructor.name });
  };

  // Add discussion post to mock state
  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const newPost: MobileDiscussionPost = {
      id: `post-${Date.now()}`,
      authorName: "Juliana Ahmed",
      authorRole: "Student",
      authorInitials: "JA",
      title: replyText.trim().slice(0, 45) + (replyText.length > 45 ? "..." : ""),
      content: replyText.trim(),
      timestamp: "Just now",
      likesCount: 0,
      repliesCount: 0,
    };

    setDiscussionPosts((prev) => [newPost, ...prev]);
    setReplyText("");
    showToast("Discussion post submitted");
  };

  const percentage = isEnrolled
    ? Math.round((course.completedDocs / Math.max(1, course.totalDocs)) * 100)
    : 0;

  if (activeSubScreen?.type === "doc") {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col text-slate-900 antialiased">
        <TopAppBar
          variant="detail"
          title={activeSubScreen.title}
          backLabel="Overview"
          onBack={() => setActiveSubScreen(null)}
        />
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-16">
          <DocsOnlyBanner variant="full" />
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">{activeSubScreen.title}</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Interactive mobile document reader with markdown and PDF annotations will render here.
            </p>
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60">
              Document Viewer Stub
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (activeSubScreen?.type === "chat") {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col text-slate-900 antialiased">
        <ChatConversationScreen
          conversationId={course.instructor.conversationId}
          initialName={course.instructor.name}
          initialRole={course.instructor.title}
          initialInitials={course.instructor.initials}
          backLabel="Overview"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col text-slate-900 antialiased">
      <MobileToast message={toastMessage} />

      {/* 1. Detail TopAppBar */}
      <TopAppBar
        variant="detail"
        title={course.title}
        backLabel={isEnrolled ? "My Courses" : "Explore"}
        onBack={() => navigate(isEnrolled ? "/my-courses" : "/explore")}
        rightSlot={
          <button
            type="button"
            onClick={() => showToast("Options menu")}
            aria-label="Course options"
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        }
      />

      {/* Main scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-16">
        <DocsOnlyBanner variant="compact" />

        {/* 2. Course Hero Banner */}
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-2xs">
          {course.imageSrc && (
            <div className="relative w-full h-36 bg-slate-100 overflow-hidden">
              <img
                src={course.imageSrc}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/60 via-transparent to-transparent" />
            </div>
          )}

          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              {isEnrolled ? (
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold tracking-wider uppercase border border-emerald-200/50">
                  IN PROGRESS
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold tracking-wider uppercase border border-amber-200/60">
                  <Lock className="w-3 h-3" />
                  NOT ENROLLED
                </span>
              )}
              <span className="text-[11px] font-semibold text-slate-400">
                {course.totalDocs} documents
              </span>
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                {course.title}
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {course.subtitle}
              </p>
            </div>

            {/* Progress bar if enrolled */}
            {isEnrolled ? (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    {course.completedDocs} of {course.totalDocs} documents completed
                  </span>
                  <span className="text-emerald-600 font-bold">{percentage}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Enroll to access document library</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. Instructor Row */}
        <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center ring-2 ring-emerald-200 shrink-0">
              {course.instructor.initials}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {course.instructor.name}
              </h3>
              <p className="text-[10.5px] text-slate-500 truncate font-medium">
                {course.instructor.title}
              </p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {course.instructor.credentials}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMessageInstructor}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1.5 border border-emerald-200/80 transition-colors shrink-0 cursor-pointer shadow-2xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Message</span>
          </button>
        </div>

        {/* 4. Course Workspace Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("syllabus")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === "syllabus"
                ? "bg-white text-emerald-800 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Syllabus
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("resources")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === "resources"
                ? "bg-white text-emerald-800 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Resources ({course.resources?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("discussion")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === "discussion"
                ? "bg-white text-emerald-800 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Discussion ({discussionPosts.length})
          </button>
        </div>

        {/* Tab 1: Syllabus / Modules List */}
        {activeTab === "syllabus" && (
          <div className="space-y-3">
            {course.modules.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 text-xs text-slate-400 font-medium">
                Syllabus reading modules will be published shortly.
              </div>
            ) : (
              course.modules.map((mod) => {
                const isExpanded = Boolean(expandedModules[mod.id]);
                return (
                  <div
                    key={mod.id}
                    className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-2xs"
                  >
                    {/* Accordion Header */}
                    <button
                      type="button"
                      onClick={() => toggleModule(mod.id)}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                            Module {mod.number}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {mod.lessons.length} documents
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-1 truncate">
                          {mod.title}
                        </h3>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>

                    {/* Accordion Lesson List */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 divide-y divide-slate-100 bg-slate-50/50">
                        {mod.lessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => {
                              if (!isEnrolled) {
                                showToast("Enrollment required to read documents");
                                return;
                              }
                              handleOpenDocumentReader(lesson.documentTitle);
                            }}
                            className={`w-full p-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                              isEnrolled ? "hover:bg-emerald-50/40" : "opacity-75"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {lesson.isCompleted ? (
                                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                              ) : (
                                <Circle className="w-4.5 h-4.5 text-slate-300 shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">
                                  {lesson.title}
                                </h4>
                                <p className="text-[10.5px] text-slate-400 mt-0.5 flex items-center gap-2">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {lesson.duration}
                                  </span>
                                  <span>·</span>
                                  <span className="text-emerald-700 font-semibold truncate">
                                    {lesson.documentTitle}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <span className="text-[10.5px] font-bold text-emerald-700 hover:text-emerald-800 shrink-0">
                              Read doc →
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Course Resources List */}
        {activeTab === "resources" && (
          <div className="space-y-3">
            {course.resources.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 text-xs text-slate-400 font-medium">
                No supplementary resources uploaded yet.
              </div>
            ) : (
              course.resources.map((res) => (
                <DocumentListRow
                  key={res.id}
                  document={res}
                  onClick={() => handleOpenDocumentReader(res.filename)}
                  onMoreClick={(e) => {
                    e.stopPropagation();
                    showToast(`Downloading ${res.filename}...`);
                  }}
                />
              ))
            )}
          </div>
        )}

        {/* Tab 3: Course Discussion Workspace */}
        {activeTab === "discussion" && (
          <div className="space-y-3">
            {/* New post composer */}
            <form
              onSubmit={handleAddPost}
              className="bg-white rounded-3xl border border-slate-100 p-3.5 shadow-2xs space-y-2.5"
            >
              <h4 className="text-xs font-bold text-slate-900">
                Ask a question or share a thought
              </h4>
              <textarea
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a message to your classmates and instructor..."
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                    replyText.trim()
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post message</span>
                </button>
              </div>
            </form>

            {/* Posts feed */}
            {discussionPosts.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 text-xs text-slate-400 font-medium">
                No discussion posts yet. Be the first to start the conversation!
              </div>
            ) : (
              discussionPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-3xl border border-slate-100 p-4 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                        {post.authorInitials}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {post.authorName}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {post.authorRole} · {post.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>

                  <h5 className="text-xs font-bold text-slate-900 leading-snug">
                    {post.title}
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {post.content}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500 font-semibold">
                    <button
                      type="button"
                      onClick={() => showToast("Liked discussion post")}
                      className="flex items-center gap-1 hover:text-emerald-700 transition-colors cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{post.likesCount}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast("Opening thread replies...")}
                      className="flex items-center gap-1 hover:text-emerald-700 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{post.repliesCount} replies</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
