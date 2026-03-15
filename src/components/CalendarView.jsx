import { useMemo, useState } from "react";
import "./CalendarView.css";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarDaysIcon, 
  ClipboardDocumentListIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import { toYmd, normalizeDueDate } from "../utils/dateUtils";
import { useTranslation } from "react-i18next";

function CalendarView({ todos, onToggleComplete, onGoBoard }) {
  const { t: translate, i18n } = useTranslation();
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedYmd, setSelectedYmd] = useState(() => toYmd(new Date()));

  const monthKey = `${viewDate.getFullYear()}-${viewDate.getMonth()}`;

  const tasksByDay = useMemo(() => {
    const map = new Map();
    for (const t of todos) {
      const ymd = normalizeDueDate(t.dueDate);
      if (!ymd) continue;
      const arr = map.get(ymd);
      if (arr) {
        arr.push(t);
      } else {
        map.set(ymd, [t]);
      }
    }
    return map;
  }, [todos]);

  const monthCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const cells = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push({ kind: "pad", key: `pad-${monthKey}-${i}` });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const ymd = toYmd(d);
      cells.push({ kind: "day", key: ymd, day, ymd });
    }
    return cells;
  }, [monthKey, viewDate]);

  const selectedDateLabel = useMemo(() => {
    const [y, m, d] = selectedYmd.split("-").map((n) => Number(n));
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(i18n.language, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [i18n.language, selectedYmd]);

  const selectedTasks = useMemo(() => {
    const list = tasksByDay.get(selectedYmd) || [];
    const active = [];
    const done = [];
    for (const t of list) {
      if (t.isComplete) done.push(t);
      else active.push(t);
    }
    return [...active, ...done];
  }, [selectedYmd, tasksByDay]);

  const isTodayYmd = useMemo(() => toYmd(today), [today]);

  const changeMonth = (delta) => {
    const next = new Date(viewDate);
    next.setMonth(next.getMonth() + delta);
    setViewDate(next);
  };

  const jumpToToday = () => {
    const d = new Date();
    setViewDate(d);
    setSelectedYmd(toYmd(d));
  };

  return (
    <section className="calendar-view-container">
      <div className="calendar-page-header">
        <div>
          <div className="calendar-page-title">{translate("calendar.title")}</div>
          <div className="calendar-page-subtitle">{translate("calendar.subtitle")}</div>
        </div>
        <div className="calendar-view-actions">
          <button className="calendar-today-btn" type="button" onClick={jumpToToday}>
            <CalendarDaysIcon strokeWidth={2} />
            {translate("calendar.actions.today")}
          </button>
          <button className="calendar-go-board-btn" type="button" onClick={onGoBoard}>
            <ClipboardDocumentListIcon strokeWidth={2} />
            {translate("calendar.actions.openBoard")}
          </button>
        </div>
      </div>

      <div className="calendar-view-layout">
        <div className="calendar-view-panel">
          <div className="calendar-header calendar-view-header">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="calendar-nav-btn"
              aria-label={translate("calendar.aria.previousMonth")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="calendar-month-year">
              {viewDate.toLocaleDateString(i18n.language, { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="calendar-nav-btn"
              aria-label={translate("calendar.aria.nextMonth")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          <div className="calendar-grid-header calendar-view-grid-header">
            {["su", "mo", "tu", "we", "th", "fr", "sa"].map((d) => (
              <div key={d} className="calendar-day-name">
                {translate(`calendar.weekdays.short.${d}`)}
              </div>
            ))}
          </div>

          <div className="calendar-view-grid">
            {monthCells.map((cell) => {
              if (cell.kind === "pad") {
                return <div key={cell.key} className="calendar-view-cell padding" />;
              }

              const tasks = tasksByDay.get(cell.ymd) || [];
              const isSelected = cell.ymd === selectedYmd;
              const isToday = cell.ymd === isTodayYmd;
              const taskPreview = tasks.slice(0, 3);
              const remaining = tasks.length - taskPreview.length;

              return (
                <button
                  key={cell.key}
                  type="button"
                  className={[
                    "calendar-view-cell",
                    isSelected ? "selected" : "",
                    isToday ? "today" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setSelectedYmd(cell.ymd)}
                >
                  <div className="calendar-view-cell-top">
                    <span className="calendar-view-day-number">{cell.day}</span>
                    {tasks.length > 0 ? (
                      <span className="calendar-view-count">{tasks.length}</span>
                    ) : null}
                  </div>
                  <div className="calendar-view-cell-tasks">
                    {taskPreview.map((t) => (
                      <div
                        key={t.id}
                        className={[
                          "calendar-task-chip",
                          t.isComplete ? "done" : "",
                          `p-${(t.priority || "Medium").toLowerCase()}`,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        title={t.name}
                      >
                        <span className="calendar-task-dot" />
                        <span className="calendar-task-text">{t.name}</span>
                      </div>
                    ))}
                    {remaining > 0 ? (
                      <div className="calendar-task-more">{translate("calendar.more.label", { count: remaining })}</div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="calendar-view-sidebar">
          <div className="calendar-sidebar-header">
            <div className="calendar-sidebar-title">{selectedDateLabel}</div>
            <div className="calendar-sidebar-subtitle">
              {translate("calendar.sidebar.subtitle", { count: selectedTasks.length })}
            </div>
          </div>

          {selectedTasks.length === 0 ? (
            <div className="calendar-sidebar-empty">
              <CheckCircleIcon className="icon-lg text-muted" style={{ width: '48px', height: '48px', opacity: 0.2 }} />
              <div>{translate("calendar.empty.noTasksDue")}</div>
            </div>
          ) : (
            <div className="calendar-sidebar-list">
              {selectedTasks.map((t) => (
                <div key={t.id} className="calendar-sidebar-item">
                  <button
                    type="button"
                    className="calendar-sidebar-check"
                    onClick={() => onToggleComplete(t)}
                    aria-label={
                      t.isComplete
                        ? translate("calendar.ariaTasks.markNotComplete")
                        : translate("calendar.ariaTasks.markComplete")
                    }
                  >
                    <span className={t.isComplete ? "check-dot checked" : "check-dot"} />
                  </button>
                  <div className="calendar-sidebar-main">
                    <div className="calendar-sidebar-row">
                      <span
                        className={[
                          "calendar-status-pill",
                          `priority-${(t.priority || "Medium").toLowerCase()}`,
                        ].join(" ")}
                      >
                        {translate(`board.priority.${String(t.priority || "Medium").toLowerCase()}`)}
                      </span>
                      <span className={t.isComplete ? "calendar-sidebar-name done" : "calendar-sidebar-name"}>
                        {t.name}
                      </span>
                    </div>
                    <div className="calendar-sidebar-meta">
                      {t.isComplete ? translate("calendar.status.completed") : translate("calendar.status.pending")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

export default CalendarView;
