import { useMemo, useState } from "react";
import "./CalendarView.css";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { toYmd, normalizeDueDate } from "../utils/dateUtils";

function CalendarView({ todos, onToggleComplete, onGoBoard }) {
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
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedYmd]);

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
          <div className="calendar-page-title">Calendar</div>
          <div className="calendar-page-subtitle">Plan your deadlines across the month.</div>
        </div>
        <div className="calendar-view-actions">
          <button className="calendar-today-btn" type="button" onClick={jumpToToday}>
            Today
          </button>
          <button className="calendar-go-board-btn" type="button" onClick={onGoBoard}>
            Open Board
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
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="icon-xs" />
            </button>
            <span className="calendar-month-year">
              {viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="calendar-nav-btn"
              aria-label="Next month"
            >
              <ChevronRightIcon className="icon-xs" />
            </button>
          </div>

          <div className="calendar-grid-header calendar-view-grid-header">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={`${d}-${i}`} className="calendar-day-name">
                {d}
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
                      <div className="calendar-task-more">+{remaining} more</div>
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
              {selectedTasks.length} task{selectedTasks.length === 1 ? "" : "s"} due
            </div>
          </div>

          {selectedTasks.length === 0 ? (
            <div className="calendar-sidebar-empty">No tasks due on this day.</div>
          ) : (
            <div className="calendar-sidebar-list">
              {selectedTasks.map((t) => (
                <div key={t.id} className="calendar-sidebar-item">
                  <button
                    type="button"
                    className="calendar-sidebar-check"
                    onClick={() => onToggleComplete(t)}
                    aria-label={t.isComplete ? "Mark as not complete" : "Mark as complete"}
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
                        {t.priority || "Medium"}
                      </span>
                      <span className={t.isComplete ? "calendar-sidebar-name done" : "calendar-sidebar-name"}>
                        {t.name}
                      </span>
                    </div>
                    <div className="calendar-sidebar-meta">
                      {t.isComplete ? "Completed" : "Pending"}
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
