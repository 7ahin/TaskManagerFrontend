import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./TimelineView.css";
import { toYmd, normalizeDueDate } from "../utils/dateUtils";
import {
  ArrowsUpDownIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

function TimelineGroupSortDropdown({ value, onChange, options, isOpen, onToggle, onClose, ariaLabel }) {
  const selectedLabel = (options.find((o) => o.value === value) || options[0])?.label;
  const btnRef = useRef(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0, width: 0, maxHeight: 0 });

  const computePopupPos = () => {
    const rect = btnRef.current?.getBoundingClientRect?.();
    const width = Math.min(260, Math.max(200, Math.ceil(rect?.width || 240)));
    const desiredHeight = 280;
    const minHeight = 160;
    const gap = 8;
    const margin = 10;

    if (!rect) {
      setPopupPos({ top: margin, left: margin, width, maxHeight: desiredHeight });
      return;
    }

    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const left = Math.min(Math.max(margin, rect.right - width), maxLeft);

    const spaceBelow = window.innerHeight - margin - (rect.bottom + gap);
    const spaceAbove = rect.top - margin - gap;
    const placeBelow =
      spaceBelow >= 220 ? true : spaceAbove >= 220 ? false : spaceBelow >= spaceAbove;

    const maxHeight = Math.max(minHeight, Math.min(desiredHeight, placeBelow ? spaceBelow : spaceAbove));
    const top = placeBelow ? rect.bottom + gap : rect.top - gap - maxHeight;

    setPopupPos({ top, left, width, maxHeight });
  };

  useEffect(() => {
    if (!isOpen) return;
    let raf = 0;
    const onScrollOrResize = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        computePopupPos();
      });
    };
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [isOpen]);

  return (
    <div className="timeline-dropdown timeline-group-sort">
      <button
        ref={btnRef}
        type="button"
        className={`timeline-filter-select timeline-dropdown-trigger timeline-group-sort-btn ${isOpen ? "is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          if (!isOpen) computePopupPos();
          onToggle();
        }}
        title={ariaLabel}
      >
        <ArrowsUpDownIcon className="timeline-dropdown-icon" aria-hidden="true" />
        <span className="timeline-dropdown-label timeline-group-sort-label">{selectedLabel}</span>
        <ChevronDownIcon className={`timeline-dropdown-chevron ${isOpen ? "is-open" : ""}`} aria-hidden="true" />
      </button>

      {isOpen
        ? createPortal(
            <>
              <div className="timeline-dropdown-backdrop" onClick={onClose} aria-hidden="true" />
              <div
                className="timeline-dropdown-menu timeline-group-sort-menu"
                style={{
                  position: "fixed",
                  top: popupPos.top,
                  left: popupPos.left,
                  width: popupPos.width,
                  maxHeight: popupPos.maxHeight,
                }}
                role="listbox"
                aria-label={ariaLabel}
              >
                {options.map((o) => {
                  const selected = o.value === value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`timeline-dropdown-option ${selected ? "is-selected" : ""}`}
                      onClick={() => {
                        onChange(o.value);
                        onClose();
                      }}
                    >
                      <span className="timeline-dropdown-option-label">{o.label}</span>
                      {selected ? <span className="timeline-dropdown-check" aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
            </>,
            document.body
          )
        : null}
    </div>
  );
}

function TimelineDatePicker({ value, onChange, placeholder }) {
  const { t: translate, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const btnRef = useRef(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0, maxHeight: 0 });

  const ymdToLocalDate = (ymd) => {
    if (!ymd || typeof ymd !== "string") return null;
    const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const yy = Number(m[1]);
    const mm = Number(m[2]);
    const dd = Number(m[3]);
    const d = new Date(yy, mm - 1, dd);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  };

  const today = new Date();
  const selectedDate = ymdToLocalDate(value);
  const [viewDate, setViewDate] = useState(selectedDate || today);

  const displayDate = selectedDate
    ? selectedDate.toLocaleDateString(i18n.language, { month: "short", day: "numeric", year: "numeric" })
    : placeholder || translate("board.dates.selectDate", "Select date");

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const { daysInMonth, firstDayOfMonth } = getDaysInMonth(viewDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const daysOfWeek = Array.from({ length: 7 }, (_, i) =>
    new Date(2021, 7, 1 + i).toLocaleDateString(i18n.language, { weekday: "narrow" })
  );

  const changeMonth = (increment) => {
    const next = new Date(viewDate);
    next.setMonth(next.getMonth() + increment);
    setViewDate(next);
  };

  const handleDateSelect = (day) => {
    const next = new Date(viewDate);
    next.setDate(day);
    const year = next.getFullYear();
    const month = String(next.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    onChange(`${year}-${month}-${dayStr}`);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const handleToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const dayStr = String(now.getDate()).padStart(2, "0");
    onChange(`${year}-${month}-${dayStr}`);
    setIsOpen(false);
  };

  const computePopupPos = () => {
    const rect = btnRef.current?.getBoundingClientRect?.();
    const width = 240;
    const desiredHeight = 320;
    const minHeight = 180;
    const gap = 6;
    const margin = 10;

    if (!rect) {
      setPopupPos({ top: margin, left: margin, maxHeight: desiredHeight });
      return;
    }

    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const left = Math.min(Math.max(margin, rect.right - width), maxLeft);

    const spaceBelow = window.innerHeight - margin - (rect.bottom + gap);
    const spaceAbove = rect.top - margin - gap;
    const placeBelow =
      spaceBelow >= 240 ? true : spaceAbove >= 240 ? false : spaceBelow >= spaceAbove;

    const maxHeight = Math.max(minHeight, Math.min(desiredHeight, placeBelow ? spaceBelow : spaceAbove));
    const top = placeBelow ? rect.bottom + gap : rect.top - gap - maxHeight;

    setPopupPos({ top, left, maxHeight });
  };

  const openPopup = () => {
    setViewDate(ymdToLocalDate(value) || new Date());
    computePopupPos();
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    let raf = 0;
    const onScrollOrResize = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        computePopupPos();
      });
    };
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [isOpen]);

  return (
    <div className="timeline-date-picker" onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        type="button"
        className="timeline-date-btn"
        onClick={() => (isOpen ? setIsOpen(false) : openPopup())}
        aria-expanded={isOpen}
      >
        <div className={`timeline-date-display ${!value ? "timeline-date-placeholder" : ""}`}>
          <CalendarDaysIcon className="timeline-date-icon" aria-hidden="true" />
          <span className="timeline-date-text">{displayDate}</span>
        </div>
        <ChevronDownIcon className={`timeline-date-chevron ${isOpen ? "is-open" : ""}`} aria-hidden="true" />
      </button>

      {isOpen
        ? createPortal(
            <>
              <div className="timeline-date-backdrop" onClick={() => setIsOpen(false)} aria-hidden="true" />
              <div
                className="timeline-calendar-popup"
                style={{
                  position: "fixed",
                  top: popupPos.top,
                  left: popupPos.left,
                  maxHeight: popupPos.maxHeight,
                  overflowY: "auto",
                }}
                role="dialog"
                aria-label={translate("board.dates.selectDate", "Select date")}
              >
                <div className="timeline-calendar-header">
                  <button type="button" onClick={() => changeMonth(-1)} className="timeline-calendar-nav-btn">
                    <ChevronLeftIcon className="timeline-calendar-nav-icon" aria-hidden="true" />
                  </button>
                  <span className="timeline-calendar-month-year">
                    {viewDate.toLocaleDateString(i18n.language, { month: "long", year: "numeric" })}
                  </span>
                  <button type="button" onClick={() => changeMonth(1)} className="timeline-calendar-nav-btn">
                    <ChevronRightIcon className="timeline-calendar-nav-icon" aria-hidden="true" />
                  </button>
                </div>

                <div className="timeline-calendar-grid-header">
                  {daysOfWeek.map((d, i) => (
                    <div key={`${d}-${i}`} className="timeline-calendar-day-name">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="timeline-calendar-grid">
                  {paddingDays.map((p) => (
                    <div key={`padding-${p}`} className="timeline-calendar-day padding" />
                  ))}
                  {days.map((day) => {
                    const isSelected =
                      !!selectedDate &&
                      selectedDate.getDate() === day &&
                      selectedDate.getMonth() === viewDate.getMonth() &&
                      selectedDate.getFullYear() === viewDate.getFullYear();

                    const isToday =
                      today.getDate() === day &&
                      today.getMonth() === viewDate.getMonth() &&
                      today.getFullYear() === viewDate.getFullYear();

                    return (
                      <div
                        key={day}
                        className={`timeline-calendar-day ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
                        onClick={() => handleDateSelect(day)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") handleDateSelect(day);
                        }}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>

                <div className="timeline-calendar-footer">
                  {value ? (
                    <button type="button" className="timeline-calendar-footer-btn" onClick={handleClear}>
                      {translate("board.buttons.clear", "Clear")}
                    </button>
                  ) : (
                    <span />
                  )}
                  <button type="button" className="timeline-calendar-footer-btn" onClick={handleToday}>
                    {translate("dashboard.due.today", "Today")}
                  </button>
                </div>
              </div>
            </>,
            document.body
          )
        : null}
    </div>
  );
}

function TimelineView({ todos, onToggleComplete, onGoBoard, onOpenTask, onUpdateTask }) {
  const { t: translate, i18n } = useTranslation();
  const language = i18n.language;
  const [timelineSearch, setTimelineSearch] = useState("");
  const [timelineShowDone, setTimelineShowDone] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [groupBy, setGroupBy] = useState("day");
  const [sortMode, setSortMode] = useState(() => {
    return localStorage.getItem("taskSenpai.timeline.sortMode") || "created_desc";
  });
  const [openGroupSortKey, setOpenGroupSortKey] = useState(null);
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

  useEffect(() => {
    localStorage.setItem("taskSenpai.timeline.sortMode", sortMode);
  }, [sortMode]);

  useEffect(() => {
    if (!openGroupSortKey) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpenGroupSortKey(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openGroupSortKey]);

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

  const sortOptions = useMemo(
    () => [
      { value: "created_desc", label: translate("board.sort.createdDesc", "Created (newest)") },
      { value: "created_asc", label: translate("board.sort.createdAsc", "Created (oldest)") },
      { value: "start_asc", label: translate("board.sort.startAsc", "Start date (soonest)") },
      { value: "start_desc", label: translate("board.sort.startDesc", "Start date (latest)") },
      { value: "priority_desc", label: translate("board.sort.priorityDesc", "Priority (High–Low)") },
      { value: "priority_asc", label: translate("board.sort.priorityAsc", "Priority (Low–High)") },
      { value: "name_asc", label: translate("board.sort.nameAsc", "Name (A–Z)") },
      { value: "name_desc", label: translate("board.sort.nameDesc", "Name (Z–A)") },
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

  const sortItems = useMemo(() => {
    const toMs = (value) => {
      if (!value) return null;
      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [yy, mm, dd] = value.split("-").map((p) => Number(p));
        const d = new Date(yy, mm - 1, dd);
        const ms = d.getTime();
        return Number.isFinite(ms) ? ms : null;
      }
      const d = new Date(value);
      const ms = d.getTime();
      return Number.isFinite(ms) ? ms : null;
    };

    const createdMsOf = (t) =>
      toMs(
        t?.createdAt ??
          t?.CreatedAt ??
          t?.created_at ??
          t?.createdDate ??
          t?.created_on ??
          t?.CreatedOn ??
          null
      );

    const startMsOf = (t) => toMs(t?.startDate ?? t?.start_date ?? null);

    const nameOf = (t) => String(t?.name || "");

    const cmpNameAsc = (a, b) => nameOf(a).localeCompare(nameOf(b), language, { sensitivity: "base" });

    const priorityRankOf = (t) => {
      const raw = String(t?.priority || "Medium").trim().toLowerCase();
      if (raw === "high") return 3;
      if (raw === "low") return 1;
      return 2;
    };

    const idOrder = (t) => {
      const v = t?.id;
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
      return null;
    };

    return (items, mode) => {
      const next = items ? [...items] : [];
      if (!mode) mode = "created_desc";

      next.sort((a, b) => {
        if (!!a?.isComplete !== !!b?.isComplete) return a?.isComplete ? 1 : -1;

        if (mode === "name_asc") return cmpNameAsc(a, b);
        if (mode === "name_desc") return -cmpNameAsc(a, b);

        if (mode === "created_desc" || mode === "created_asc") {
          const am = createdMsOf(a);
          const bm = createdMsOf(b);
          if (am == null && bm == null) {
            const ai = idOrder(a);
            const bi = idOrder(b);
            if (ai != null && bi != null) return mode === "created_desc" ? bi - ai : ai - bi;
            return cmpNameAsc(a, b);
          }
          if (am == null) return 1;
          if (bm == null) return -1;
          return mode === "created_desc" ? bm - am : am - bm;
        }

        if (mode === "start_desc" || mode === "start_asc") {
          const am = startMsOf(a);
          const bm = startMsOf(b);
          if (am == null && bm == null) return cmpNameAsc(a, b);
          if (am == null) return 1;
          if (bm == null) return -1;
          return mode === "start_desc" ? bm - am : am - bm;
        }

        if (mode === "priority_desc" || mode === "priority_asc") {
          const ar = priorityRankOf(a);
          const br = priorityRankOf(b);
          if (ar !== br) return mode === "priority_desc" ? br - ar : ar - br;
          return cmpNameAsc(a, b);
        }

        return cmpNameAsc(a, b);
      });

      return next;
    };
  }, [language]);

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

    const mode = sortMode || "created_desc";
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
          start: start.toLocaleDateString(language, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          end: end.toLocaleDateString(language, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        });

        const items = (byGroupKey.get(key) || []).map((i) => i.t);
        const tasks = sortItems(items, mode);
        return { key, label, tasks, sortMode: mode };
      }

      const date = ymdToDate(key);
      const prefixKey = key < todayYmd ? "overdue" : key === todayYmd ? "today" : "upcoming";
      const label = translate("timeline.group.day.label", {
        prefix: translate(`timeline.group.prefix.${prefixKey}`),
        date: date.toLocaleDateString(language, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });

      const items = (byGroupKey.get(key) || []).map((i) => i.t);
      const tasks = sortItems(items, mode);
      return { key, label, tasks, sortMode: mode };
    });

    const undated = sortItems(noDate, mode);
    return { groups, undated, undatedSortMode: mode };
  }, [todos, timelineSearch, timelineShowDone, priorityFilter, groupBy, language, sortItems, sortMode, translate]);

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
                <div className="timeline-group-left">
                  <div className="timeline-group-title">{g.label}</div>
                  <div className="timeline-group-count">{g.tasks.length}</div>
                </div>
                <div className="timeline-group-right">
                  <TimelineGroupSortDropdown
                    value={g.sortMode}
                    options={sortOptions}
                    ariaLabel={translate("timeline.sort.label", "Sort")}
                    isOpen={openGroupSortKey === g.key}
                    onToggle={() => {
                      setOpenDropdown(null);
                      setOpenGroupSortKey((prev) => (prev === g.key ? null : g.key));
                    }}
                    onClose={() => setOpenGroupSortKey(null)}
                    onChange={(value) => {
                      setSortMode(value);
                      setOpenGroupSortKey(null);
                    }}
                  />
                </div>
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
                                date: new Date(t.dueDate).toLocaleDateString(language, { month: "short", day: "numeric" }),
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
                        <TimelineDatePicker
                          value={normalizeDueDate(t.startDate) || ""}
                          onChange={(val) => onUpdateTask({ ...t, startDate: val })}
                          placeholder={translate("timeline.dates.startPlaceholder", "Start")}
                        />
                      </div>
                      <div className="timeline-date-group">
                        <span className="timeline-date-label">{translate("timeline.dates.dueLabel")}</span>
                        <TimelineDatePicker
                          value={normalizeDueDate(t.dueDate) || ""}
                          onChange={(val) => onUpdateTask({ ...t, dueDate: val })}
                          placeholder={translate("timeline.dates.duePlaceholder", "Due")}
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
                <div className="timeline-group-left">
                  <div className="timeline-group-title">{translate("timeline.group.noDates")}</div>
                  <div className="timeline-group-count">{timelineGroups.undated.length}</div>
                </div>
                <div className="timeline-group-right">
                  <TimelineGroupSortDropdown
                    value={timelineGroups.undatedSortMode}
                    options={sortOptions}
                    ariaLabel={translate("timeline.sort.label", "Sort")}
                    isOpen={openGroupSortKey === "__undated__"}
                    onToggle={() => {
                      setOpenDropdown(null);
                      setOpenGroupSortKey((prev) => (prev === "__undated__" ? null : "__undated__"));
                    }}
                    onClose={() => setOpenGroupSortKey(null)}
                    onChange={(value) => {
                      setSortMode(value);
                      setOpenGroupSortKey(null);
                    }}
                  />
                </div>
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
                                date: new Date(t.dueDate).toLocaleDateString(language, { month: "short", day: "numeric" }),
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
                        <TimelineDatePicker
                          value={normalizeDueDate(t.startDate) || ""}
                          onChange={(val) => onUpdateTask({ ...t, startDate: val })}
                          placeholder={translate("timeline.dates.startPlaceholder", "Start")}
                        />
                      </div>
                      <div className="timeline-date-group">
                        <span className="timeline-date-label">{translate("timeline.dates.dueLabel")}</span>
                        <TimelineDatePicker
                          value={normalizeDueDate(t.dueDate) || ""}
                          onChange={(val) => onUpdateTask({ ...t, dueDate: val })}
                          placeholder={translate("timeline.dates.duePlaceholder", "Due")}
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
