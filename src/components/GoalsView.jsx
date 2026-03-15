import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./GoalsView.css";
import toast from "react-hot-toast";
import { normalizeDueDate } from "../utils/dateUtils";
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { ChevronUpIcon as ChevronUpSolid, ChevronDownIcon as ChevronDownSolid } from "@heroicons/react/20/solid";

const API_URL = "https://localhost:7076/api/Goals";

const GOAL_TEMPLATES = [
  { title: "Productive Week (20 tasks)", target: 20, type: "completed_all" },
  { title: "Clear 5 High Priority", target: 5, type: "completed_high" },
  { title: "Daily Grind (5 tasks)", target: 5, type: "completed_all" },
];

const GOAL_TYPES = [
  { value: "completed_all", label: "Completed tasks" },
  { value: "completed_high", label: "Completed high priority" },
];

function GoalTypeDropdown({ value, onChange, id }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = GOAL_TYPES.find((t) => t.value === value) || GOAL_TYPES[0];

  return (
    <div className="goals-dropdown-container">
      <button
        type="button"
        id={id}
        className="goals-dropdown-btn"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="goals-dropdown-text">{selected.label}</span>
        <ChevronDownIcon className={`goals-dropdown-chevron ${isOpen ? "open" : ""}`} />
      </button>

      {isOpen ? (
        <>
          <div className="goals-click-capture" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className="goals-dropdown-menu" role="listbox" aria-labelledby={id}>
            {GOAL_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`goals-dropdown-item ${t.value === value ? "selected" : ""}`}
                role="option"
                aria-selected={t.value === value}
                onClick={() => {
                  onChange(t.value);
                  setIsOpen(false);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function GoalDatePicker({ value, onChange, id, placeholder = "No due date" }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedDate = value ? new Date(value) : null;
  const display = selectedDate
    ? selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : placeholder;

  const [viewYear, setViewYear] = useState(() => (selectedDate ? selectedDate.getFullYear() : new Date().getFullYear()));
  const [viewMonth, setViewMonth] = useState(() => (selectedDate ? selectedDate.getMonth() : new Date().getMonth()));

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startDay = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const selectedKey =
    selectedDate != null
      ? `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`
      : "";

  const moveMonth = (delta) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const setYmd = (d) => {
    if (!d) {
      onChange("");
      return;
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${day}`);
  };

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="goals-date-container">
      <button
        type="button"
        id={id}
        className="goals-date-btn"
        onClick={() => {
          if (!isOpen) {
            const base = selectedDate || new Date();
            setViewYear(base.getFullYear());
            setViewMonth(base.getMonth());
          }
          setIsOpen((v) => !v);
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="goals-date-left">
          <CalendarIcon className="goals-date-icon" />
          <span className={`goals-date-text ${selectedDate ? "" : "muted"}`}>{display}</span>
        </span>
        <ChevronDownIcon className={`goals-date-chevron ${isOpen ? "open" : ""}`} />
      </button>

      {isOpen ? (
        <>
          <div className="goals-dropdown-backdrop" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className="goals-calendar-modal" role="dialog" aria-modal="true" aria-labelledby={id}>
            <div className="goals-calendar-panel" onClick={(e) => e.stopPropagation()}>
              <div className="goals-calendar-header">
                <button
                  type="button"
                  className="goals-calendar-nav"
                  onClick={() => moveMonth(-1)}
                  aria-label="Previous month"
                  title="Previous month"
                >
                  <ChevronLeftIcon className="goals-calendar-nav-icon" />
                </button>
                <div className="goals-calendar-title">
                  {new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </div>
                <button
                  type="button"
                  className="goals-calendar-nav"
                  onClick={() => moveMonth(1)}
                  aria-label="Next month"
                  title="Next month"
                >
                  <ChevronRightIcon className="goals-calendar-nav-icon" />
                </button>
              </div>

              <div className="goals-calendar-weekdays">
                {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                  <div key={d} className="goals-calendar-weekday">
                    {d}
                  </div>
                ))}
              </div>

              <div className="goals-calendar-grid">
                {Array.from({ length: startDay }).map((_, i) => (
                  <div key={`e-${i}`} className="goals-calendar-empty" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const k = `${viewYear}-${viewMonth}-${dayNum}`;
                  const isSelected = selectedKey === k;
                  const isToday = todayKey === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      className={`goals-calendar-day ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
                      onClick={() => {
                        setYmd(new Date(viewYear, viewMonth, dayNum));
                        setIsOpen(false);
                      }}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>

              <div className="goals-calendar-actions">
                <button
                  type="button"
                  className="goals-calendar-link"
                  onClick={() => {
                    setYmd(new Date());
                    setIsOpen(false);
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="goals-calendar-link"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    setYmd(d);
                    setIsOpen(false);
                  }}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  className="goals-calendar-link"
                  onClick={() => {
                    const d = new Date();
                    const day = d.getDay(); // 0 Sun ... 6 Sat
                    const daysToEndOfWeek = 6 - day; // Saturday as end
                    d.setDate(d.getDate() + Math.max(0, daysToEndOfWeek));
                    setYmd(d);
                    setIsOpen(false);
                  }}
                >
                  End of week
                </button>
                <button
                  type="button"
                  className="goals-calendar-link"
                  onClick={() => {
                    const d = new Date();
                    const day = d.getDay();
                    // Move to next Monday
                    const delta = ((8 - day) % 7) || 7;
                    d.setDate(d.getDate() + delta);
                    setYmd(d);
                    setIsOpen(false);
                  }}
                >
                  Next week
                </button>
                <button
                  type="button"
                  className="goals-calendar-link danger"
                  onClick={() => {
                    onChange("");
                    setIsOpen(false);
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function GoalsView({ todos, onGoBoard }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalType, setNewGoalType] = useState("completed_all");
  const [newGoalTarget, setNewGoalTarget] = useState(10);
  const [newGoalDueDate, setNewGoalDueDate] = useState("");
  const [editingGoal, setEditingGoal] = useState(null);
  const [editingGoalType, setEditingGoalType] = useState("completed_all");
  const [editingGoalDueDate, setEditingGoalDueDate] = useState("");
  const editTargetRef = useRef(null);
  const [showAchieved, setShowAchieved] = useState(() => {
    return localStorage.getItem("taskSenpai.goals.showAchieved") === "true";
  });

  // Load goals from API
  useEffect(() => {
    loadGoals();
  }, []);

  useEffect(() => {
    if (!editingGoal) return;
    setEditingGoalType(editingGoal.type || "completed_all");
    setEditingGoalDueDate(editingGoal.dueDate ? normalizeDueDate(editingGoal.dueDate) || "" : "");
  }, [editingGoal]);

  useEffect(() => {
    if (!editingGoal) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [editingGoal]);

  useEffect(() => {
    localStorage.setItem("taskSenpai.goals.showAchieved", showAchieved ? "true" : "false");
  }, [showAchieved]);

  async function loadGoals() {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to load goals");
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      console.error("Error loading goals:", error);
      toast.error("Could not load goals");
    } finally {
      setLoading(false);
    }
  }

  const goalStats = useMemo(() => {
    const completed = todos.filter((t) => t.isComplete).length;
    const completedHigh = todos.filter(
      (t) => t.isComplete && (t.priority || "Medium").toLowerCase() === "high"
    ).length;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const overdue = todos.filter((t) => {
      if (t.isComplete) return false;
      const ymd = normalizeDueDate(t.dueDate);
      if (!ymd) return false;
      const d = new Date(ymd);
      return d.getTime() < startOfToday;
    }).length;

    const active = todos.filter((t) => !t.isComplete).length;
    const completionRate =
      todos.length === 0 ? 0 : Math.round((completed / todos.length) * 100);

    return { completed, completedHigh, overdue, active, completionRate };
  }, [todos]);

  const [addSaving, setAddSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const lastDeletedRef = useRef(null);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    const title = newGoalTitle.trim();
    const target = Number(newGoalTarget);
    if (!title) return;
    if (!Number.isFinite(target) || target <= 0) return;

    const newGoal = {
      title,
      type: newGoalType === "completed_high" ? "completed_high" : "completed_all",
      target: Math.floor(target),
      dueDate: newGoalDueDate || null,
    };

    try {
      setAddSaving(true);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGoal),
      });

      if (!response.ok) throw new Error("Failed to create goal");
      
      const savedGoal = await response.json();
      setGoals((prev) => [savedGoal, ...prev]);
      
      setNewGoalTitle("");
      setNewGoalTarget(10);
      setNewGoalDueDate("");
      toast.success("Goal added");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add goal");
    } finally {
      setAddSaving(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    try {
      const toDelete = goals.find((g) => g.id === id) || null;
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete goal");

      setGoals((prev) => prev.filter((g) => g.id !== id));
      if (toDelete) {
        lastDeletedRef.current = toDelete;
        toast((t) => (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span>Goal removed</span>
            <button
              className="action-button"
              onClick={async () => {
                const g = lastDeletedRef.current;
                if (!g) return toast.dismiss(t.id);
                try {
                  const resp = await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: g.title, type: g.type, target: g.target, dueDate: g.dueDate || null }),
                  });
                  if (resp.ok) {
                    const back = await resp.json();
                    setGoals((prev) => [back, ...prev]);
                    toast.success("Undo successful");
                  } else {
                    toast.error("Undo failed");
                  }
                } catch {
                  toast.error("Undo failed");
                } finally {
                  toast.dismiss(t.id);
                }
              }}
            >
              Undo
            </button>
          </div>
        ));
      } else {
        toast.success("Goal removed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete goal");
    }
  };

  const handleSaveEdit = async (updated) => {
    try {
      setEditSaving(true);
      const response = await fetch(`${API_URL}/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!response.ok) throw new Error("Failed to update goal");

      setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      setEditingGoal(null);
      toast.success("Goal updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update goal");
    } finally {
      setEditSaving(false);
    }
  };

  const goalRows = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const msDay = 1000 * 60 * 60 * 24;

    const toDueStart = (g) => {
      const ymd = normalizeDueDate(g?.dueDate);
      if (!ymd) return null;
      const d = new Date(ymd);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    };

    const rows = (goals || []).map((g) => {
      const current = g.type === "completed_high" ? goalStats.completedHigh : goalStats.completed;
      const target = Number(g.target) || 0;
      const pct = target > 0 ? Math.round(Math.min(1, current / target) * 100) : 0;
      const achieved = target > 0 ? current >= target : false;
      const remaining = Math.max(0, target - current);
      const dueStart = toDueStart(g);
      const daysLeft = dueStart == null ? null : Math.ceil((dueStart - startOfToday) / msDay);
      const needPerDay =
        !achieved && remaining > 0 && daysLeft != null
          ? remaining / Math.max(1, daysLeft + 1)
          : null;

      return { g, current, target, pct, achieved, remaining, dueStart, daysLeft, needPerDay };
    });

    const visible = showAchieved ? rows : rows.filter((r) => !r.achieved);

    visible.sort((a, b) => {
      if (a.achieved !== b.achieved) return a.achieved ? 1 : -1;
      const ad = a.dueStart;
      const bd = b.dueStart;
      if (ad != null && bd != null && ad !== bd) return ad - bd;
      if (ad != null && bd == null) return -1;
      if (ad == null && bd != null) return 1;
      if (a.pct !== b.pct) return b.pct - a.pct;
      return String(a.g?.title || "").localeCompare(String(b.g?.title || ""));
    });

    const achievedCount = rows.filter((r) => r.achieved).length;
    return { rows: visible, achievedCount };
  }, [goals, goalStats.completed, goalStats.completedHigh, showAchieved]);

  return (
    <section className="board-card">
      <div className="board-header">
        <div>
          <div className="board-title">Goals</div>
          <div className="board-subtitle">Set targets and track progress from your tasks.</div>
        </div>
        <div className="calendar-view-actions">
          <button className="calendar-go-board-btn" type="button" onClick={onGoBoard}>
            Open Board
          </button>
        </div>
      </div>

      <div className="goals-summary-grid">
        <div className="goals-summary-card">
          <div className="goals-summary-label">Completion rate</div>
          <div className="goals-summary-value">{goalStats.completionRate}%</div>
          <div className="goals-summary-sub">
            {goalStats.completed} done • {goalStats.active} active
          </div>
        </div>
        <div className="goals-summary-card">
          <div className="goals-summary-label">Overdue</div>
          <div className="goals-summary-value">{goalStats.overdue}</div>
          <div className="goals-summary-sub">Incomplete tasks past due date</div>
        </div>
        <div className="goals-summary-card">
          <div className="goals-summary-label">High priority done</div>
          <div className="goals-summary-value">{goalStats.completedHigh}</div>
          <div className="goals-summary-sub">Completed tasks marked High</div>
        </div>
      </div>

      <div className="goals-layout">
        <div className="goals-panel">
          <div className="goals-panel-title">Create goal</div>
          <div className="goal-templates">
            <div className="template-label">Quick start</div>
            <div className="goal-template-grid">
              {GOAL_TEMPLATES.map((t) => (
                <button
                  key={t.title}
                  type="button"
                  className="goal-template-card"
                  onClick={() => {
                    setNewGoalTitle(t.title);
                    setNewGoalType(t.type);
                    setNewGoalTarget(t.target);
                  }}
                >
                  <div className="goal-template-title">{t.title}</div>
                  <div className="goal-template-meta">
                    <span className="goal-template-pill">{t.type === "completed_high" ? "High priority" : "All tasks"}</span>
                    <span className="goal-template-pill">{t.target} target</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <form
            className="goals-form"
            onSubmit={handleAddGoal}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                // Allow Cmd/Ctrl+Enter to submit
                e.currentTarget.requestSubmit();
              }
            }}
          >
            <div className="form-row">
              <div className="form-group">
                <label>Goal title</label>
                <input
                  className="edit-input"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g. Finish 20 tasks"
                  required
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <GoalTypeDropdown id="goal-type-create" value={newGoalType} onChange={setNewGoalType} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Target</label>
                <div className="qty-input">
                  <button
                    type="button"
                    className="qty-btn"
                    aria-label="Decrease target"
                    disabled={Number(newGoalTarget || 1) <= 1}
                    onClick={() =>
                      setNewGoalTarget((v) => {
                        const n = Math.max(1, Math.floor(Number(v || 1)) - 1);
                        return String(n);
                      })
                    }
                    onPointerDown={(e) => {
                      if (Number(newGoalTarget || 1) <= 1) return;
                      e.currentTarget.setPointerCapture(e.pointerId);
                      const step = () =>
                        setNewGoalTarget((v) => String(Math.max(1, Math.floor(Number(v || 1)) - 1)));
                      const intervalRef = { id: 0 };
                      const start = () => {
                        intervalRef.id = setInterval(step, 80);
                      };
                      step();
                      const timeoutId = setTimeout(start, 300);
                      const clearAll = () => {
                        clearTimeout(timeoutId);
                        clearInterval(intervalRef.id);
                        if (e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        }
                        e.currentTarget.removeEventListener("pointerup", clearAll);
                        e.currentTarget.removeEventListener("pointerleave", clearAll);
                        e.currentTarget.removeEventListener("pointercancel", clearAll);
                      };
                      e.currentTarget.addEventListener("pointerup", clearAll);
                      e.currentTarget.addEventListener("pointerleave", clearAll);
                      e.currentTarget.addEventListener("pointercancel", clearAll);
                    }}
                  >
                    −
                  </button>
                  <input
                    className="qty-field"
                    type="number"
                    min={1}
                    step={1}
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="qty-btn"
                    aria-label="Increase target"
                    onClick={() =>
                      setNewGoalTarget((v) => {
                        const n = Math.max(1, Math.floor(Number(v || 0)) + 1);
                        return String(n);
                      })
                    }
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      const step = () =>
                        setNewGoalTarget((v) => String(Math.max(1, Math.floor(Number(v || 0)) + 1)));
                      const intervalRef = { id: 0 };
                      const start = () => {
                        intervalRef.id = setInterval(step, 80);
                      };
                      step();
                      const timeoutId = setTimeout(start, 300);
                      const clearAll = () => {
                        clearTimeout(timeoutId);
                        clearInterval(intervalRef.id);
                        if (e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        }
                        e.currentTarget.removeEventListener("pointerup", clearAll);
                        e.currentTarget.removeEventListener("pointerleave", clearAll);
                        e.currentTarget.removeEventListener("pointercancel", clearAll);
                      };
                      e.currentTarget.addEventListener("pointerup", clearAll);
                      e.currentTarget.addEventListener("pointerleave", clearAll);
                      e.currentTarget.addEventListener("pointercancel", clearAll);
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Due date (optional)</label>
                <GoalDatePicker id="goal-due-create" value={newGoalDueDate} onChange={setNewGoalDueDate} />
              </div>
            </div>
            <div className="goals-form-actions">
              <button className="action-button primary" type="submit" disabled={addSaving || !newGoalTitle.trim()}>
                {addSaving ? "Adding..." : "Add Goal"}
              </button>
            </div>
          </form>
        </div>

        <div className="goals-panel">
          <div className="goals-panel-header">
            <div className="goals-panel-title">Your goals</div>
            <button
              type="button"
              className={`goals-toggle ${showAchieved ? "active" : ""}`}
              onClick={() => setShowAchieved((v) => !v)}
              disabled={goalRows.achievedCount === 0}
            >
              Show achieved {goalRows.achievedCount > 0 ? `(${goalRows.achievedCount})` : ""}
            </button>
          </div>
          {loading ? (
             <div className="empty-state">Loading goals...</div>
          ) : goalRows.rows.length === 0 ? (
            <div className="empty-state">
              {goalRows.achievedCount > 0
                ? "All goals achieved. Toggle “Show achieved” to see them."
                : "No goals yet. Create one to start tracking."}
            </div>
          ) : (
            <div className="goals-list">
              {goalRows.rows.map((row) => {
                const g = row.g;
                const pct = row.pct;
                const current = row.current;
                const remaining = row.remaining;
                const daysLeft = row.daysLeft;
                const needPerDay = row.needPerDay;
                const hasDue = row.dueStart != null;
                const dueLabel =
                  !hasDue
                    ? "Set a due date"
                    : daysLeft < 0
                      ? `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"}`
                      : daysLeft === 0
                        ? "Due today"
                        : `Due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
                return (
                  <div key={g.id} className="goal-card">
                    <div className="goal-card-top">
                      <div className="goal-card-title">{g.title}</div>
                      <div className="goal-card-actions">
                        {pct >= 100 ? <span className="goal-meta-pill achieved">Achieved</span> : null}
                        <button
                          type="button"
                          className="action-button"
                          onClick={() => setEditingGoal(g)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="action-button"
                          onClick={() => onGoBoard(g.type === "completed_high" ? "high_priority" : "pending")}
                        >
                          View Tasks
                        </button>
                        <button
                          type="button"
                          className="action-button delete"
                          onClick={() => handleDeleteGoal(g.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="goal-card-meta">
                      <span className="goal-meta-pill">
                        {g.type === "completed_high" ? "High priority" : "All tasks"}
                      </span>
                      {g.dueDate ? (
                        <span className="goal-meta-pill">
                          Due {new Date(g.dueDate).toLocaleDateString()}
                        </span>
                      ) : null}
                      <span className="goal-meta-pill">
                        {current}/{g.target} • {pct}%
                      </span>
                    </div>
                    <div className="goal-insights">
                      <div className="goal-insight">
                        <div className="goal-insight-label">Remaining</div>
                        <div className="goal-insight-value">{remaining}</div>
                      </div>
                      <div className="goal-insight">
                        <div className="goal-insight-label">{hasDue ? "Due" : "Pace"}</div>
                        <div className={`goal-insight-value ${daysLeft != null && daysLeft < 0 ? "danger" : ""}`}>
                          {hasDue ? dueLabel : dueLabel}
                        </div>
                      </div>
                      <div className="goal-insight">
                        <div className="goal-insight-label">Needed/day</div>
                        <div className="goal-insight-value">
                          {needPerDay != null ? needPerDay.toFixed(1) : "—"}
                        </div>
                      </div>
                    </div>
                    <div className="goal-progress">
                      <div className="goal-progress-track">
                        <div className="goal-progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {editingGoal
        ? createPortal(
            <div className="modal-overlay" onClick={() => setEditingGoal(null)}>
              <div
                className="modal-content goals-modal"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditingGoal(null);
                }}
                tabIndex={-1}
              >
                <div className="modal-header">
                  <div className="modal-title">Edit Goal</div>
                </div>
                <div className="modal-body">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target;
                      const title = form.title.value.trim();
                      const type = form.type.value;
                      const target = Math.max(1, Math.floor(Number(form.target.value)));
                      const dueDate = form.dueDate.value || null;
                      if (!title) return;
                      handleSaveEdit({
                        ...editingGoal,
                        title,
                        type: type === "completed_high" ? "completed_high" : "completed_all",
                        target,
                        dueDate,
                      });
                    }}
                  >
                    <input type="hidden" name="type" value={editingGoalType} />
                    <input type="hidden" name="dueDate" value={editingGoalDueDate} />
                    <div className="form-row">
                      <div className="form-group">
                        <label>Goal title</label>
                        <input className="edit-input" name="title" defaultValue={editingGoal.title} required />
                      </div>
                      <div className="form-group">
                        <label>Type</label>
                        <GoalTypeDropdown
                          id="goal-type-edit"
                          value={editingGoalType}
                          onChange={setEditingGoalType}
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Target</label>
                        <div className="qty-input">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => {
                              if (!editTargetRef.current) return;
                              const n = Math.max(1, Math.floor(Number(editTargetRef.current.value || 1)) - 1);
                              editTargetRef.current.value = String(n);
                            }}
                          >
                            −
                          </button>
                          <input
                            className="qty-field"
                            type="number"
                            name="target"
                            min={1}
                            step={1}
                            defaultValue={editingGoal.target}
                            ref={editTargetRef}
                            required
                          />
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => {
                              if (!editTargetRef.current) return;
                              const n = Math.max(1, Math.floor(Number(editTargetRef.current.value || 0)) + 1);
                              editTargetRef.current.value = String(n);
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Due date (optional)</label>
                        <GoalDatePicker
                          id="goal-due-edit"
                          value={editingGoalDueDate}
                          onChange={setEditingGoalDueDate}
                        />
                      </div>
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="action-button" onClick={() => setEditingGoal(null)}>
                        Cancel
                      </button>
                      <button type="submit" className="action-button primary" disabled={editSaving}>
                        {editSaving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </section>
  );
}

export default GoalsView;
