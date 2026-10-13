import { Calendar as CalendarIcon, FileText, Plus, CheckCircle2 } from "lucide-react";
import type { AgendaItem, ReminderItem, StudyGoalProgress } from "./calendar.types";
import { EVENT_TYPE_CONFIG } from "./calendar-helpers";
import { ProgressRing } from "../ProgressRing";
import fireAsset from "../../../Assets/fire.webp";

interface CalendarSidebarProps {
  agendaItems: AgendaItem[];
  studyGoal: StudyGoalProgress;
  reminders: ReminderItem[];
  onOpenNewEventForToday: () => void;
  onViewFullAgenda: () => void;
  onEditGoal: () => void;
  onAddReminder: () => void;
  onViewAllReminders: () => void;
}

export function CalendarSidebar({
  agendaItems,
  studyGoal,
  reminders,
  onOpenNewEventForToday,
  onViewFullAgenda,
  onEditGoal,
  onAddReminder,
  onViewAllReminders,
}: CalendarSidebarProps) {
  return (
    <aside className="calendar-sidebar">
      {/* Widget 1: Today's Agenda */}
      <div className="calendar-widget" aria-labelledby="widget-agenda-title">
        <div className="calendar-widget__header">
          <h2 id="widget-agenda-title" className="calendar-widget__title">
            Today&apos;s agenda
          </h2>
          <button
            type="button"
            className="calendar-widget__icon-btn"
            onClick={onOpenNewEventForToday}
            aria-label="Add item to today's agenda"
          >
            <CalendarIcon size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="calendar-agenda-list" role="list">
          {agendaItems.map((item) => {
            const IconComponent = EVENT_TYPE_CONFIG[item.type]?.icon || FileText;
            return (
              <div key={item.id} className="calendar-agenda-item" role="listitem">
                <span className="calendar-agenda-item__time">{item.time}</span>
                <div
                  className={`calendar-agenda-item__icon-wrap calendar-agenda-item__icon-wrap--${item.type}`}
                >
                  <IconComponent size={16} aria-hidden="true" />
                </div>
                <div className="calendar-agenda-item__details">
                  <h3 className="calendar-agenda-item__title">{item.title}</h3>
                  <p className="calendar-agenda-item__subtitle">{item.subtitle}</p>
                </div>
                {item.hasAction && (
                  <button
                    type="button"
                    className="calendar-agenda-item__btn-join"
                    onClick={() => {
                      if (item.linkUrl) {
                        window.open(item.linkUrl, "_blank", "noopener,noreferrer");
                      }
                    }}
                  >
                    {item.actionLabel || "Join"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button type="button" className="calendar-widget__link" onClick={onViewFullAgenda}>
          <span>View full agenda</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {/* Widget 2: Study Goal Progress */}
      <div className="calendar-widget" aria-labelledby="widget-goal-title">
        <div className="calendar-widget__header">
          <h2 id="widget-goal-title" className="calendar-widget__title">
            Study goal progress
          </h2>
          <button type="button" className="calendar-widget__btn-edit" onClick={onEditGoal}>
            Edit
          </button>
        </div>

        <div className="calendar-goal-card">
          {/* Donut chart */}
          <div className="calendar-goal-donut">
            <ProgressRing
              size={76}
              radius={30}
              percentage={studyGoal.weeklyPercentage}
              strokeWidth={7}
              trackColor="#eef2ef"
              progressColor="#087f55"
              ariaLabel={`Study goal ${studyGoal.weeklyPercentage}% completed`}
            />
            <div className="calendar-goal-donut__text">
              <span className="calendar-goal-donut__pct">{studyGoal.weeklyPercentage}%</span>
              <span className="calendar-goal-donut__label">of weekly goal</span>
            </div>
          </div>

          <div className="calendar-goal-stats">
            <h3 className="calendar-goal-stats__hours">
              {studyGoal.completedHours} / {studyGoal.targetHours} hours
            </h3>
            <p className="calendar-goal-stats__sub">
              Keep it up!
              <img className="weekly-goal-fire" alt="" aria-hidden="true" src={fireAsset} />
            </p>
          </div>
        </div>

        {/* Streak dots */}
        <div className="calendar-streak-row" aria-label="Daily study goal completion streak">
          {studyGoal.streakDays.map((st, i) => (
            <div key={i} className="calendar-streak-day">
              <span
                className={`calendar-streak-day__dot ${
                  st.completed ? "calendar-streak-day__dot--active" : ""
                }`}
                aria-hidden="true"
              />
              <span className="calendar-streak-day__label">{st.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Widget 3: Reminders */}
      <div className="calendar-widget" aria-labelledby="widget-reminders-title">
        <div className="calendar-widget__header">
          <h2 id="widget-reminders-title" className="calendar-widget__title">
            Reminders
          </h2>
          <button
            type="button"
            className="calendar-widget__icon-btn"
            onClick={onAddReminder}
            aria-label="Add new reminder"
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="calendar-reminder-list" role="list">
          {reminders.map((rem) => {
            const IconComponent =
              rem.type === "quiz"
                ? FileText
                : rem.type === "goal"
                ? CheckCircle2
                : FileText;

            return (
              <div key={rem.id} className="calendar-reminder-item" role="listitem">
                <div
                  className={`calendar-reminder-item__icon-wrap calendar-reminder-item__icon-wrap--${rem.type}`}
                >
                  <IconComponent size={14} aria-hidden="true" />
                </div>
                <div className="calendar-reminder-item__details">
                  <h3 className="calendar-reminder-item__title">{rem.title}</h3>
                  <p className="calendar-reminder-item__date">{rem.dateLabel}</p>
                </div>
                <span
                  className={`calendar-reminder-item__badge calendar-reminder-item__badge--${rem.type}`}
                >
                  {rem.type}
                </span>
              </div>
            );
          })}
        </div>

        <button type="button" className="calendar-widget__link" onClick={onViewAllReminders}>
          <span>View all reminders</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </aside>
  );
}
