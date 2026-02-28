import { useMemo, useState } from "react";
import "./TimelineView.css";
import { toYmd, normalizeDueDate } from "../utils/dateUtils";

function TimelineView({ todos, onToggleComplete, onGoBoard, onOpenTask, onUpdateTask }) {
  const [timelineSearch, setTimelineSearch] = useState("");
  const [timelineShowDone, setTimelineShowDone] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [groupBy, setGroupBy] = useState("day");

  const timelineGroups = useMemo(() => {
    const term = timelineSearch.trim().toLowerCase();
    const todayYmd = toYmd(new Date());

    const byGroupKey = new Map();
    const noDate = [];

    const ymdToDate = (ymd) => {
      const [y, m, d] = ymd.split("-").map((n) => Number(n));
      return new Date(y, m - 1, d);
    };

    const weekStartDate = (d) => {
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const day = start.getDay();
      const daysSinceMonday = (day + 6) % 7;
      start.setDate(start.getDate() - daysSinceMonday);
      return start;
    };

    for (const t of todos) {
      if (!timelineShowDone && t.isComplete) continue;
      if (term && !t.name?.toLowerCase().includes(term)) continue;
      
      const p = (t.priority || "Medium");
      if (priorityFilter !== "All" && p !== priorityFilter) continue;

      const ymd = normalizeDueDate(t.dueDate);
      if (!ymd) {
        noDate.push(t);
        continue;
      }
      const groupKey =
        groupBy === "week" ? toYmd(weekStartDate(ymdToDate(ymd))) : ymd;
      const arr = byGroupKey.get(groupKey);
      if (arr) arr.push({ t, ymd });
      else byGroupKey.set(groupKey, [{ t, ymd }]);
    }

    const priorityRank = (p) => {
      const key = (p || "Medium").toLowerCase();
      if (key === "high") return 0;
      if (key === "medium") return 1;
      return 2;
    };

    const sortTasks = (a, b) => {
      if (a.isComplete !== b.isComplete) return a.isComplete ? 1 : -1;
      const pr = priorityRank(a.priority) - priorityRank(b.priority);
      if (pr !== 0) return pr;
      return String(a.name || "").localeCompare(String(b.name || ""));
    };

    const keys = Array.from(byGroupKey.keys()).sort((a, b) => a.localeCompare(b));
    const groups = keys.map((key) => {
      if (groupBy === "week") {
        const start = ymdToDate(key);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const startYmd = toYmd(start);
        const endYmd = toYmd(end);
        const prefix =
          endYmd < todayYmd ? "Overdue" : startYmd <= todayYmd && todayYmd <= endYmd ? "This week" : "Upcoming";
        const label = `${prefix} — ${start.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })} – ${end.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;

        const items = (byGroupKey.get(key) || [])
          .slice()
          .sort((a, b) => a.ymd.localeCompare(b.ymd) || sortTasks(a.t, b.t));
        return { key, label, tasks: items.map((i) => i.t) };
      }

      const date = ymdToDate(key);
      const prefix = key < todayYmd ? "Overdue" : key === todayYmd ? "Today" : "Upcoming";
      const label = `${prefix} — ${date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;

      const tasks = (byGroupKey.get(key) || [])
        .slice()
        .map((i) => i.t)
        .sort(sortTasks);
      return { key, label, tasks };
    });

    const undated = noDate.slice().sort(sortTasks);
    return { groups, undated };
  }, [todos, timelineSearch, timelineShowDone, priorityFilter, groupBy]);

  return (
    <section className="timeline-view-container">
      <div className="timeline-header">
        <div>
          <div className="timeline-title">Timeline</div>
          <div className="timeline-subtitle">
            {groupBy === "week"
              ? "Tasks grouped by due week (overdue → upcoming)."
              : "Tasks grouped by due date (overdue → upcoming)."}
          </div>
        </div>
        <div className="timeline-view-actions">
        <button className="timeline-go-board-btn" type="button" onClick={onGoBoard}>
          Open Board
        </button>
      </div>
      </div>

      <div className="timeline-controls">
        <input
          className="search-input timeline-search"
          type="search"
          placeholder="Search tasks in timeline"
          value={timelineSearch}
          onChange={(e) => setTimelineSearch(e.target.value)}
        />
        <select
          className="timeline-filter-select"
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
        >
          <option value="day">Group by day</option>
          <option value="week">Group by week</option>
        </select>
        <select
          className="timeline-filter-select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="All">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <label className="timeline-toggle">
          <input
            type="checkbox"
            checked={timelineShowDone}
            onChange={(e) => setTimelineShowDone(e.target.checked)}
          />
          <span>Show done</span>
        </label>
      </div>

      {timelineGroups.groups.length === 0 && timelineGroups.undated.length === 0 ? (
        <div className="empty-state">No tasks match your timeline filters.</div>
      ) : (
        <div className="timeline-groups">
          {timelineGroups.groups.map((g) => (
            <div key={g.key} className="timeline-group">
              <div className="timeline-group-header">
                <div className="timeline-group-title">{g.label}</div>
                <div className="timeline-group-count">{g.tasks.length}</div>
              </div>
              <div className="timeline-list">
                {g.tasks.map((t) => (
                  <div key={t.id} className={`timeline-item ${t.isComplete ? "done" : ""}`}>
                    <div className="timeline-item-left">
                      <input
                        className="timeline-checkbox"
                        type="checkbox"
                        checked={!!t.isComplete}
                        onChange={() => onToggleComplete(t)}
                      />
                    </div>
                    <div className="timeline-item-main">
                      <div className="timeline-item-title">{t.name}</div>
                      <div className="timeline-item-meta">
                        <span className={`timeline-status-pill priority-${(t.priority || "Medium").toLowerCase()}`}>
                          {t.priority || "Medium"}
                        </span>
                        <span className={`timeline-status-pill ${t.isComplete ? "done" : "working"}`}>
                          {t.isComplete ? "Done" : "Working on it"}
                        </span>
                      </div>
                    </div>
                    <div className="timeline-item-actions">
                      <input
                        type="date"
                        className="timeline-date-input"
                        value={normalizeDueDate(t.dueDate) || ""}
                        onChange={(e) => onUpdateTask({ ...t, dueDate: e.target.value })}
                        title="Reschedule"
                      />
                      <button type="button" className="timeline-action-button" onClick={() => onOpenTask(t)}>
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {timelineGroups.undated.length > 0 ? (
            <div className="timeline-group">
              <div className="timeline-group-header">
                <div className="timeline-group-title">No due date</div>
                <div className="timeline-group-count">{timelineGroups.undated.length}</div>
              </div>
              <div className="timeline-list">
                {timelineGroups.undated.map((t) => (
                  <div key={t.id} className={`timeline-item ${t.isComplete ? "done" : ""}`}>
                    <div className="timeline-item-left">
                      <input
                        className="timeline-checkbox"
                        type="checkbox"
                        checked={!!t.isComplete}
                        onChange={() => onToggleComplete(t)}
                      />
                    </div>
                    <div className="timeline-item-main">
                      <div className="timeline-item-title">{t.name}</div>
                      <div className="timeline-item-meta">
                        <span className={`timeline-status-pill priority-${(t.priority || "Medium").toLowerCase()}`}>
                          {t.priority || "Medium"}
                        </span>
                        <span className={`timeline-status-pill ${t.isComplete ? "done" : "working"}`}>
                          {t.isComplete ? "Done" : "Working on it"}
                        </span>
                      </div>
                    </div>
                    <div className="timeline-item-actions">
                      <input
                        type="date"
                        className="timeline-date-input"
                        value={normalizeDueDate(t.dueDate) || ""}
                        onChange={(e) => onUpdateTask({ ...t, dueDate: e.target.value })}
                        title="Reschedule"
                      />
                      <button type="button" className="action-button" onClick={() => onOpenTask(t)}>
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

export default TimelineView;
