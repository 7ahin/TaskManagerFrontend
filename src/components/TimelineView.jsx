import { useEffect, useMemo, useRef, useState } from "react";
import "./TimelineView.css";
import { toYmd, normalizeDueDate } from "../utils/dateUtils";
import { CalendarDaysIcon, ChevronDownIcon, FlagIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

function TimelineView({ todos, onToggleComplete, onGoBoard, onOpenTask, onUpdateTask }) {
  const { t: translate, i18n } = useTranslation();
  const [timelineSearch, setTimelineSearch] = useState("");
  const [timelineShowDone, setTimelineShowDone] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [groupBy, setGroupBy] = useState("day");
  const [openDropdown, setOpenDropdown] = useState(null);
  const groupByBtnRef = useRef(null);
  const priorityBtnRef = useRef(null);
  const dropdownMenuRef = useRef(null);

  useEffect(() => {
    if (!openDropdown) return;
    const onPointerDown = (e) => {
      const btn = openDropdown === "groupBy" ? groupByBtnRef.current : priorityBtnRef.current;
      if (btn && btn.contains(e.target)) return;
      if (dropdownMenuRef.current && dropdownMenuRef.current.contains(e.target)) return;
      setOpenDropdown(null);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpenDropdown(null);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openDropdown]);

  const getStatusKey = (task) => {
    const raw = String(task.status || "").trim().toLowerCase();
    if (task.isComplete) return "done";
    if (raw === "done") return "done";
    if (raw === "stuck") return "stuck";
    if (raw === "review") return "review";
    if (raw === "in progress" || raw === "in-progress") return "inProgress";
    if (raw === "working on it" || raw === "working-on-it") return "workingOnIt";
    return "workingOnIt";
  };

  const getStatusClass = (task) => {
    const key = getStatusKey(task);
    if (key === "workingOnIt") return "working-on-it";
    if (key === "inProgress") return "in-progress";
    return key;
  };

  const dropdownId = openDropdown ? `timeline-dropdown-${openDropdown}` : undefined;

  const groupByOptions = useMemo(
    () => [
      { value: "day", label: translate("timeline.groupBy.day") },
      { value: "week", label: translate("timeline.groupBy.week") },
    ],
    [translate]
  );

  const priorityOptions = useMemo(
    () => [
      { value: "All", label: translate("timeline.priority.all") },
      { value: "High", label: translate("board.priority.high") },
      { value: "Medium", label: translate("board.priority.medium") },
      { value: "Low", label: translate("board.priority.low") },
    ],
    [translate]
  );

  const getDropdownLabel = (kind) => {
    if (kind === "groupBy") return groupByOptions.find((o) => o.value === groupBy)?.label || translate("timeline.groupBy.label");
    return priorityOptions.find((o) => o.value === priorityFilter)?.label || translate("timeline.priority.all");
  };

  const onDropdownKeyDown = (e, kind) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpenDropdown((prev) => (prev === kind ? null : kind));
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpenDropdown((prev) => (prev === kind ? prev : kind));
      requestAnimationFrame(() => {
        const menu = dropdownMenuRef.current;
        if (!menu) return;
        const first = menu.querySelector('[role="option"][aria-selected="true"]') || menu.querySelector('[role="option"]');
        if (first && typeof first.focus === "function") first.focus();
      });
    }
  };

  const onOptionKeyDown = (e, kind, options) => {
    const current = e.currentTarget;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpenDropdown(null);
      const btn = kind === "groupBy" ? groupByBtnRef.current : priorityBtnRef.current;
      if (btn) btn.focus();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const items = Array.from(current.parentElement?.querySelectorAll('[role="option"]') || []);
      const idx = items.indexOf(current);
      if (idx < 0) return;
      const nextIdx = e.key === "ArrowDown" ? Math.min(items.length - 1, idx + 1) : Math.max(0, idx - 1);
      items[nextIdx]?.focus();
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const value = current.getAttribute("data-value");
      if (!value) return;
      if (kind === "groupBy") setGroupBy(value);
      else setPriorityFilter(value);
      setOpenDropdown(null);
      const btn = kind === "groupBy" ? groupByBtnRef.current : priorityBtnRef.current;
      if (btn) btn.focus();
      return;
    }
    const key = String(e.key || "").toLowerCase();
    if (key.length === 1 && /[a-z0-9]/.test(key)) {
      const menu = current.parentElement;
      if (!menu) return;
      const match = options.find((o) => String(o.label).toLowerCase().startsWith(key));
      if (!match) return;
      const el = menu.querySelector(`[role="option"][data-value="${CSS.escape(match.value)}"]`);
      if (el && typeof el.focus === "function") el.focus();
    }
  };

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

      // Use startDate if available, otherwise fallback to dueDate
      const ymd = normalizeDueDate(t.startDate || t.dueDate);
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
        const prefixKey =
          endYmd < todayYmd
            ? "overdue"
            : startYmd <= todayYmd && todayYmd <= endYmd
              ? "thisWeek"
              : "upcoming";
        const label = translate("timeline.group.week.label", {
          prefix: translate(`timeline.group.prefix.${prefixKey}`),
          start: start.toLocaleDateString(i18n.language, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          end: end.toLocaleDateString(i18n.language, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        });

        const items = (byGroupKey.get(key) || [])
          .slice()
          .sort((a, b) => a.ymd.localeCompare(b.ymd) || sortTasks(a.t, b.t));
        return { key, label, tasks: items.map((i) => i.t) };
      }

      const date = ymdToDate(key);
      const prefixKey = key < todayYmd ? "overdue" : key === todayYmd ? "today" : "upcoming";
      const label = translate("timeline.group.day.label", {
        prefix: translate(`timeline.group.prefix.${prefixKey}`),
        date: date.toLocaleDateString(i18n.language, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });

      const tasks = (byGroupKey.get(key) || [])
        .slice()
        .map((i) => i.t)
        .sort(sortTasks);
      return { key, label, tasks };
    });

    const undated = noDate.slice().sort(sortTasks);
    return { groups, undated };
  }, [todos, timelineSearch, timelineShowDone, priorityFilter, groupBy, i18n.language, translate]);

  return (
    <section className="timeline-view-container">
      <div className="timeline-header">
        <div>
          <div className="timeline-title">{translate("timeline.title")}</div>
          <div className="timeline-subtitle">
            {groupBy === "week"
              ? translate("timeline.subtitle.week")
              : translate("timeline.subtitle.day")}
          </div>
        </div>
        <div className="timeline-view-actions">
        <button className="timeline-go-board-btn" type="button" onClick={onGoBoard}>
          {translate("timeline.actions.openBoard")}
        </button>
      </div>
      </div>

      <div className="timeline-controls">
        <input
          className="search-input timeline-search"
          type="search"
          placeholder={translate("timeline.search.placeholder")}
          value={timelineSearch}
          onChange={(e) => setTimelineSearch(e.target.value)}
        />
        <div className="timeline-dropdown">
          <button
            ref={groupByBtnRef}
            type="button"
            className={`timeline-filter-select timeline-dropdown-trigger ${openDropdown === "groupBy" ? "is-open" : ""}`}
            aria-haspopup="listbox"
            aria-expanded={openDropdown === "groupBy"}
            aria-controls={openDropdown === "groupBy" ? dropdownId : undefined}
            onClick={() => setOpenDropdown((prev) => (prev === "groupBy" ? null : "groupBy"))}
            onKeyDown={(e) => onDropdownKeyDown(e, "groupBy")}
          >
            <CalendarDaysIcon className="timeline-dropdown-icon" aria-hidden="true" />
            <span className="timeline-dropdown-label">{getDropdownLabel("groupBy")}</span>
            <ChevronDownIcon className={`timeline-dropdown-chevron ${openDropdown === "groupBy" ? "is-open" : ""}`} aria-hidden="true" />
          </button>
          {openDropdown === "groupBy" ? (
            <div
              ref={dropdownMenuRef}
              id={dropdownId}
              className="timeline-dropdown-menu"
              role="listbox"
              aria-label={translate("timeline.groupBy.label")}
            >
              {groupByOptions.map((o) => {
                const selected = o.value === groupBy;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    data-value={o.value}
                    className={`timeline-dropdown-option ${selected ? "is-selected" : ""}`}
                    onClick={() => {
                      setGroupBy(o.value);
                      setOpenDropdown(null);
                      groupByBtnRef.current?.focus();
                    }}
                    onKeyDown={(e) => onOptionKeyDown(e, "groupBy", groupByOptions)}
                  >
                    <span className="timeline-dropdown-option-label">{o.label}</span>
                    {selected ? <span className="timeline-dropdown-check" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="timeline-dropdown">
          <button
            ref={priorityBtnRef}
            type="button"
            className={`timeline-filter-select timeline-dropdown-trigger ${openDropdown === "priority" ? "is-open" : ""}`}
            aria-haspopup="listbox"
            aria-expanded={openDropdown === "priority"}
            aria-controls={openDropdown === "priority" ? dropdownId : undefined}
            onClick={() => setOpenDropdown((prev) => (prev === "priority" ? null : "priority"))}
            onKeyDown={(e) => onDropdownKeyDown(e, "priority")}
          >
            <FlagIcon className="timeline-dropdown-icon" aria-hidden="true" />
            <span className="timeline-dropdown-label">{getDropdownLabel("priority")}</span>
            <ChevronDownIcon className={`timeline-dropdown-chevron ${openDropdown === "priority" ? "is-open" : ""}`} aria-hidden="true" />
          </button>
          {openDropdown === "priority" ? (
            <div
              ref={dropdownMenuRef}
              id={dropdownId}
              className="timeline-dropdown-menu"
              role="listbox"
              aria-label={translate("timeline.priority.label")}
            >
              {priorityOptions.map((o) => {
                const selected = o.value === priorityFilter;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    data-value={o.value}
                    className={`timeline-dropdown-option ${selected ? "is-selected" : ""}`}
                    onClick={() => {
                      setPriorityFilter(o.value);
                      setOpenDropdown(null);
                      priorityBtnRef.current?.focus();
                    }}
                    onKeyDown={(e) => onOptionKeyDown(e, "priority", priorityOptions)}
                  >
                    <span className="timeline-dropdown-option-label">{o.label}</span>
                    {selected ? <span className="timeline-dropdown-check" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <label className="timeline-toggle">
          <input
            className="timeline-toggle-input"
            type="checkbox"
            checked={timelineShowDone}
            onChange={(e) => setTimelineShowDone(e.target.checked)}
          />
          <span className="timeline-toggle-ui" aria-hidden="true">
            <span className="timeline-toggle-knob" />
          </span>
          <span className="timeline-toggle-text">{translate("timeline.toggle.showDone")}</span>
        </label>
      </div>

      {timelineGroups.groups.length === 0 && timelineGroups.undated.length === 0 ? (
        <div className="empty-state">{translate("timeline.empty.noMatch")}</div>
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
                  <div
                    key={t.id}
                    className={`timeline-item ${t.isComplete ? "done" : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenTask(t)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onOpenTask(t);
                    }}
                  >
                    <div className="timeline-item-row">
                      <div className="timeline-item-left">
                        <label className="timeline-checkbox-wrap" onClick={(e) => e.stopPropagation()}>
                          <input
                            className="timeline-checkbox"
                            type="checkbox"
                            checked={!!t.isComplete}
                            onChange={() => onToggleComplete(t)}
                          />
                          <span className="timeline-checkbox-box" aria-hidden="true" />
                        </label>
                      </div>
                      <div className="timeline-item-main">
                        <div className="timeline-item-title">{t.name}</div>
                        <div className="timeline-item-meta">
                          <span className={`timeline-status-pill priority-${(t.priority || "Medium").toLowerCase()}`}>
                            {translate(`board.priority.${String(t.priority || "Medium").toLowerCase()}`)}
                          </span>
                          <span className={`timeline-status-pill status-${getStatusClass(t)}`}>
                            {translate(`board.status.${getStatusKey(t)}`)}
                          </span>
                          {t.dueDate && (
                            <span className={`timeline-due-pill ${new Date(t.dueDate) < new Date().setHours(0,0,0,0) ? "overdue" : ""}`}>
                              {translate("timeline.due.label", {
                                date: new Date(t.dueDate).toLocaleDateString(i18n.language, { month: "short", day: "numeric" }),
                              })}
                            </span>
                          )}
                          {t.startDate && t.dueDate && t.startDate > t.dueDate && (
                            <span className="timeline-conflict-warning" title={translate("timeline.conflict.title")}>
                              ⚠️ {translate("timeline.conflict.label")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="timeline-item-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="timeline-date-group">
                        <span className="timeline-date-label">{translate("timeline.dates.startLabel")}</span>
                        <input
                          type="date"
                          className="timeline-date-input"
                          value={normalizeDueDate(t.startDate) || ""}
                          onChange={(e) => onUpdateTask({ ...t, startDate: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="timeline-date-group">
                        <span className="timeline-date-label">{translate("timeline.dates.dueLabel")}</span>
                        <input
                          type="date"
                          className="timeline-date-input"
                          value={normalizeDueDate(t.dueDate) || ""}
                          onChange={(e) => onUpdateTask({ ...t, dueDate: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <button type="button" className="timeline-action-button" onClick={() => onOpenTask(t)}>
                        {translate("timeline.actions.open")}
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
                <div className="timeline-group-title">{translate("timeline.group.noDates")}</div>
                <div className="timeline-group-count">{timelineGroups.undated.length}</div>
              </div>
              <div className="timeline-list">
                {timelineGroups.undated.map((t) => (
                  <div
                    key={t.id}
                    className={`timeline-item ${t.isComplete ? "done" : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenTask(t)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onOpenTask(t);
                    }}
                  >
                    <div className="timeline-item-row">
                      <div className="timeline-item-left">
                        <label className="timeline-checkbox-wrap" onClick={(e) => e.stopPropagation()}>
                          <input
                            className="timeline-checkbox"
                            type="checkbox"
                            checked={!!t.isComplete}
                            onChange={() => onToggleComplete(t)}
                          />
                          <span className="timeline-checkbox-box" aria-hidden="true" />
                        </label>
                      </div>
                      <div className="timeline-item-main">
                        <div className="timeline-item-title">{t.name}</div>
                        <div className="timeline-item-meta">
                          <span className={`timeline-status-pill priority-${(t.priority || "Medium").toLowerCase()}`}>
                            {translate(`board.priority.${String(t.priority || "Medium").toLowerCase()}`)}
                          </span>
                          <span className={`timeline-status-pill status-${getStatusClass(t)}`}>
                            {translate(`board.status.${getStatusKey(t)}`)}
                          </span>
                          {t.dueDate && (
                            <span className={`timeline-due-pill ${new Date(t.dueDate) < new Date().setHours(0,0,0,0) ? "overdue" : ""}`}>
                              {translate("timeline.due.label", {
                                date: new Date(t.dueDate).toLocaleDateString(i18n.language, { month: "short", day: "numeric" }),
                              })}
                            </span>
                          )}
                          {t.startDate && t.dueDate && t.startDate > t.dueDate && (
                            <span className="timeline-conflict-warning" title={translate("timeline.conflict.title")}>
                              ⚠️ {translate("timeline.conflict.label")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="timeline-item-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="timeline-date-group">
                        <span className="timeline-date-label">{translate("timeline.dates.startLabel")}</span>
                        <input
                          type="date"
                          className="timeline-date-input"
                          value={normalizeDueDate(t.startDate) || ""}
                          onChange={(e) => onUpdateTask({ ...t, startDate: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="timeline-date-group">
                        <span className="timeline-date-label">{translate("timeline.dates.dueLabel")}</span>
                        <input
                          type="date"
                          className="timeline-date-input"
                          value={normalizeDueDate(t.dueDate) || ""}
                          onChange={(e) => onUpdateTask({ ...t, dueDate: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <button type="button" className="timeline-action-button" onClick={() => onOpenTask(t)}>
                        {translate("timeline.actions.open")}
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
