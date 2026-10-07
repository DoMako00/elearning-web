import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  RotateCcw,
  Bookmark,
  CheckCircle2,
  FileText,
  Download,
  HelpCircle,
  Check,
  ChevronRight,
  Folder,
  Scale,
  Star,
  ArrowUp,
} from "lucide-react";
import { ASSIGNMENT_DETAILS } from "./assignments.data";
import { SubmitAssignmentModal } from "./SubmitAssignmentModal";
import type { AssignmentDetailItem } from "./assignments.types";
import "./AssignmentDetailPage.css";

export function AssignmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId?: string }>();

  // Default to Upper Limb Clinical Case Review if id is not found
  const initialData: AssignmentDetailItem =
    (assignmentId && ASSIGNMENT_DETAILS[assignmentId]) ||
    ASSIGNMENT_DETAILS["upper-limb-clinical-case-review"];

  const [assignment, setAssignment] = useState<AssignmentDetailItem>(initialData);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveDraft = () => {
    showToast("Assignment draft saved successfully.");
  };

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
    showToast(!isSaved ? "Saved to your bookmarks." : "Removed from bookmarks.");
  };

  const handleSubmitSuccess = (data: { fileName: string; fileSize: string; note: string }) => {
    setAssignment((prev) => ({
      ...prev,
      status: "submitted",
      attemptsUsed: Math.min(prev.attemptsAllowed, prev.attemptsUsed + 1),
      submission: {
        status: "submitted",
        submittedAt: "Just now",
        fileName: data.fileName,
        fileSize: data.fileSize,
        note: data.note,
      },
    }));
    showToast("Assignment submitted successfully! 🎉");
  };

  const isSubmitted = assignment.status === "submitted" || assignment.status === "graded";
  const attemptsLeft = Math.max(0, assignment.attemptsAllowed - assignment.attemptsUsed);

  return (
    <div className="assignment-detail-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="assignment-detail-toast" role="status">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="assignment-detail-container">
        {/* Top Header Card */}
        <section className="assignment-detail-header-card">
          <div className="assignment-detail-header-top">
            <div className="assignment-detail-meta-left">
              {/* Breadcrumb row */}
              <nav className="assignment-detail-breadcrumb" aria-label="Assignment navigation">
                <Link to="/my-courses">My Courses</Link>
                <ChevronRight size={13} />
                <Link to={`/my-courses/${assignment.courseSlug}`}>{assignment.courseName}</Link>
                <ChevronRight size={13} />
                <Link to="/assignments" className="is-active">Assignments</Link>
              </nav>

              <h1 className="assignment-detail-title">{assignment.title}</h1>

              <div className="assignment-detail-course-tags">
                <span className="assignment-detail-tag">📖 {assignment.courseName}</span>
                <span className="assignment-detail-tag-dot">&bull;</span>
                <span className="assignment-detail-tag">📑 {assignment.moduleName}</span>
                <span className="assignment-detail-tag-dot">&bull;</span>
                <span className="assignment-detail-tag">👤 {assignment.instructor}</span>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="assignment-detail-header-actions">
              <span className="assignment-detail-due-pill">
                <Clock size={13} /> {assignment.relativeLabel}: {assignment.dueFullDate}
              </span>
              <button
                type="button"
                className={`assignment-detail-save-btn ${isSaved ? "is-saved" : ""}`}
                onClick={handleToggleSave}
                aria-label="Save for later"
              >
                <Bookmark size={14} className={isSaved ? "fill-current" : ""} />
                <span>{isSaved ? "Saved" : "Save for later"}</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className="assignment-detail-metrics-row">
            <div className="assignment-detail-metric-card">
              <div className="assignment-detail-metric-icon assignment-detail-metric-icon--green">
                <CalendarDays size={24} />
              </div>
              <div className="assignment-detail-metric-content">
                <span className="assignment-detail-metric-label">Due date</span>
                <strong className="assignment-detail-metric-value">{assignment.dueFullDate.split(" at ")[0]}</strong>
                <small className="assignment-detail-metric-sub">{assignment.dueFullDate.split(" at ")[1] || "11:59 PM"}</small>
              </div>
            </div>

            <div className="assignment-detail-metric-card">
              <div className="assignment-detail-metric-icon assignment-detail-metric-icon--teal">
                <Star size={24} />
              </div>
              <div className="assignment-detail-metric-content">
                <span className="assignment-detail-metric-label">Points</span>
                <strong className="assignment-detail-metric-value">{assignment.points} pts</strong>
                <small className="assignment-detail-metric-sub">Total points</small>
              </div>
            </div>

            <div className="assignment-detail-metric-card">
              <div className="assignment-detail-metric-icon assignment-detail-metric-icon--blue">
                <Clock size={24} />
              </div>
              <div className="assignment-detail-metric-content">
                <span className="assignment-detail-metric-label">Estimated time</span>
                <strong className="assignment-detail-metric-value">{assignment.estimatedTime}</strong>
                <small className="assignment-detail-metric-sub">Recommended</small>
              </div>
            </div>

            <div className="assignment-detail-metric-card">
              <div className="assignment-detail-metric-icon assignment-detail-metric-icon--orange">
                <RotateCcw size={24} />
              </div>
              <div className="assignment-detail-metric-content">
                <span className="assignment-detail-metric-label">Attempts</span>
                <strong className="assignment-detail-metric-value">{assignment.attemptsUsed} of {assignment.attemptsAllowed}</strong>
                <small className="assignment-detail-metric-sub">{attemptsLeft} Remaining</small>
              </div>
            </div>

            <div className="assignment-detail-metric-card">
              <div className="assignment-detail-metric-icon assignment-detail-metric-icon--purple">
                <ArrowUp size={24} />
              </div>
              <div className="assignment-detail-metric-content">
                <span className="assignment-detail-metric-label">Submission type</span>
                <strong className="assignment-detail-metric-value">{assignment.submissionType}</strong>
                <small className="assignment-detail-metric-sub">{assignment.acceptedFormats.join(", ")}</small>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid matching Miro */}
        <div className="assignment-detail-body-layout">
          {/* LEFT AREA: (Top row: Brief + What to submit) & (Bottom row: Resources) */}
          <div className="assignment-detail-main-column">
            {/* Top 2-Card Row: Brief & What to Submit */}
            <div className="assignment-detail-brief-row">
              {/* Brief Card */}
              <section className="assignment-detail-section-card assignment-detail-brief-card">
                <div className="assignment-detail-section-header">
                  <div className="assignment-detail-section-title">
                    <FileText size={18} className="text-emerald-600" />
                    <h2>Assignment brief</h2>
                  </div>
                </div>
                <p className="assignment-detail-brief-desc">{assignment.brief.description}</p>

                <div className="assignment-detail-todo-block">
                  <h3 className="assignment-detail-section-sub">What you need to do</h3>
                  <ul className="assignment-detail-todo-list">
                    {assignment.brief.instructions.map((inst, index) => (
                      <li key={index}>
                        <span className="assignment-detail-check-icon">
                          <Check size={11} />
                        </span>
                        <span>{inst}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* What to Submit Card */}
              <section className="assignment-detail-section-card assignment-detail-submit-info-card">
                <div className="assignment-detail-section-header">
                  <div className="assignment-detail-section-title">
                    <ArrowUp size={18} className="text-emerald-600" />
                    <h2>What to submit</h2>
                  </div>
                </div>
                <ul className="assignment-detail-req-list">
                  {assignment.whatToSubmit.requirements.map((req, index) => (
                    <li key={index}>
                      <span className="assignment-detail-check-icon assignment-detail-check-icon--emerald">
                        <Check size={11} />
                      </span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>

                {assignment.whatToSubmit.tip && (
                  <div className="assignment-detail-tip-banner">
                    <HelpCircle size={15} className="text-emerald-700 shrink-0" />
                    <p>
                      <strong>Tip:</strong> {assignment.whatToSubmit.tip}
                    </p>
                  </div>
                )}
              </section>
            </div>

            {/* Bottom Section: Assignment Resources */}
            <section className="assignment-detail-section-card assignment-detail-resources-section">
              <div className="assignment-detail-section-header">
                <div className="assignment-detail-section-title">
                  <Folder size={18} className="text-emerald-600" />
                  <h2>Assignment resources</h2>
                </div>
                <button type="button" className="assignment-detail-link-btn">
                  View all resources &rarr;
                </button>
              </div>
              <p className="assignment-detail-section-sub">
                Review these materials to help you complete this assignment.
              </p>

              <div className="assignment-detail-resources-grid">
                {assignment.resources.map((res) => (
                  <div key={res.id} className="assignment-resource-card">
                    <div className={`assignment-resource-badge assignment-resource-badge--${res.fileType}`}>
                      <span>{res.fileType.toUpperCase()}</span>
                    </div>
                    <div className="assignment-resource-info">
                      <strong className="assignment-resource-name" title={res.name}>
                        {res.name}
                      </strong>
                      <span className="assignment-resource-size">{res.size}</span>
                    </div>
                    <button
                      type="button"
                      className="assignment-resource-download"
                      onClick={() => showToast(`Downloading ${res.name}...`)}
                      aria-label={`Download ${res.name}`}
                    >
                      <Download size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Your Submission, Grading Rubric, Timeline */}
          <aside className="assignment-detail-sidebar-column">
            {/* Your Submission Action Card */}
            <section className="assignment-detail-sidebar-card assignment-submission-action-card">
              <div className="assignment-submission-card-header">
                <div className="assignment-submission-card-title">
                  <FileText size={17} className="text-emerald-600" />
                  <h3>Your submission</h3>
                </div>
                <span className="assignment-submission-percentage">
                  {assignment.status === "submitted" ? "100% complete" : "0% complete"}
                </span>
              </div>

              <div className="assignment-submission-badge-row">
                <span className={`assignment-submission-badge assignment-submission-badge--${assignment.status}`}>
                  {assignment.status === "submitted" ? "Submitted" : "Not submitted"}
                </span>
              </div>

              <div className="assignment-submission-progress-bar">
                <div
                  className="assignment-submission-progress-fill"
                  style={{ width: assignment.status === "submitted" ? "100%" : "0%" }}
                />
              </div>

              <p className="assignment-submission-hint">
                {isSubmitted
                  ? "Your assignment is submitted and under review."
                  : "Start your work and submit before the deadline."}
              </p>

              {/* Action Buttons */}
              <button
                type="button"
                className="assignment-btn-submit-main"
                onClick={() => setIsSubmitModalOpen(true)}
              >
                <ArrowUp size={16} />
                <span>{isSubmitted ? "Resubmit assignment" : "Submit assignment"}</span>
              </button>

              <button
                type="button"
                className="assignment-btn-save-draft"
                onClick={handleSaveDraft}
              >
                <Bookmark size={13} />
                <span>Save draft</span>
              </button>
            </section>

            {/* Grading Rubric Card */}
            <section className="assignment-detail-sidebar-card">
              <div className="assignment-rubric-header">
                <div className="assignment-rubric-title">
                  <Scale size={17} className="text-emerald-600" />
                  <h3>Grading rubric</h3>
                </div>
                <span className="assignment-rubric-total-badge">{assignment.rubric.totalPoints} points total</span>
              </div>

              <ul className="assignment-rubric-list">
                {assignment.rubric.items.map((item, index) => (
                  <li key={index} className="assignment-rubric-item">
                    <span className="assignment-rubric-criterion">{item.criterion}</span>
                    <strong className="assignment-rubric-pts">{item.points} pts</strong>
                  </li>
                ))}
              </ul>

              <div className="assignment-rubric-footer">
                <strong>Total</strong>
                <span className="assignment-rubric-grand-total">{assignment.rubric.totalPoints} pts</span>
              </div>
            </section>

            {/* Assignment Timeline Card */}
            <section className="assignment-detail-sidebar-card">
              <div className="assignment-timeline-header">
                <Clock size={17} className="text-emerald-600" />
                <h3>Assignment timeline</h3>
              </div>

              <div className="assignment-timeline-steps">
                {/* Step 1: Assigned */}
                <div className="assignment-timeline-step is-completed">
                  <div className="assignment-timeline-dot is-completed" />
                  <div className="assignment-timeline-step-info">
                    <span className="assignment-timeline-date">{assignment.timeline.assignedDate}</span>
                    <strong className="assignment-timeline-name">Assigned</strong>
                  </div>
                </div>

                {/* Step 2: Due date */}
                <div className={`assignment-timeline-step ${isSubmitted ? "is-completed" : "is-active"}`}>
                  <div className={`assignment-timeline-dot ${isSubmitted ? "is-completed" : "is-active"}`} />
                  <div className="assignment-timeline-step-info">
                    <span className="assignment-timeline-date">{assignment.timeline.dueDate}</span>
                    <strong className="assignment-timeline-name">Due date</strong>
                  </div>
                </div>

                {/* Step 3: Grades released */}
                <div className="assignment-timeline-step">
                  <div className="assignment-timeline-dot" />
                  <div className="assignment-timeline-step-info">
                    <span className="assignment-timeline-date">{assignment.timeline.gradesReleasedDate}</span>
                    <strong className="assignment-timeline-name">Grades released</strong>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* Submit Assignment Modal Popup */}
      <SubmitAssignmentModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        assignmentTitle={assignment.title}
        courseName={assignment.courseName}
        maxFileSizeMb={assignment.maxFileSizeMb}
        acceptedFormats={assignment.acceptedFormats}
        onSubmitSuccess={handleSubmitSuccess}
      />
    </div>
  );
}
