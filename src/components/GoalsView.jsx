import { useEffect, useMemo, useState } from "react";
import "./GoalsView.css";
import toast from "react-hot-toast";
import { normalizeDueDate } from "../utils/dateUtils";

const GOALS_STORAGE_KEY = "taskSenpai.goals.v1";

const GOAL_TEMPLATES = [
  { title: "Productive Week (20 tasks)", target: 20, type: "completed_all" },
  { title: "Clear 5 High Priority", target: 5, type: "completed_high" },
  { title: "Daily Grind (5 tasks)", target: 5, type: "completed_all" },
];

const makeId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

function GoalsView({ todos, onGoBoard }) {
  const [goals, setGoals] = useState(() => {
    try {
      const raw = localStorage.getItem(GOALS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((g) => g && typeof g === "object")
        .map((g) => ({
          id: typeof g.id === "string" ? g.id : makeId(),
          title: typeof g.title === "string" ? g.title : "Untitled goal",
          type: g.type === "completed_high" ? "completed_high" : "completed_all",
          target:
            typeof g.target === "number" && Number.isFinite(g.target) && g.target > 0
              ? Math.floor(g.target)
              : 10,
          dueDate:
            typeof g.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(g.dueDate)
              ? g.dueDate
              : null,
          createdAt: typeof g.createdAt === "string" ? g.createdAt : new Date().toISOString(),
        }));
    } catch {
      return [];
    }
  });
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalType, setNewGoalType] = useState("completed_all");
  const [newGoalTarget, setNewGoalTarget] = useState(10);
  const [newGoalDueDate, setNewGoalDueDate] = useState("");
  const [editingGoal, setEditingGoal] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
    } catch {
      return;
    }
  }, [goals]);

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

  const handleAddGoal = (e) => {
    e.preventDefault();
    const title = newGoalTitle.trim();
    const target = Number(newGoalTarget);
    if (!title) return;
    if (!Number.isFinite(target) || target <= 0) return;

    const goal = {
      id: makeId(),
      title,
      type: newGoalType === "completed_high" ? "completed_high" : "completed_all",
      target: Math.floor(target),
      dueDate: newGoalDueDate || null,
      createdAt: new Date().toISOString(),
    };

    setGoals((prev) => [goal, ...prev]);
    setNewGoalTitle("");
    setNewGoalTarget(10);
    setNewGoalDueDate("");
    toast.success("Goal added");
  };

  const handleDeleteGoal = (id) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    toast.success("Goal removed");
  };

  const handleSaveEdit = (updated) => {
    setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setEditingGoal(null);
    toast.success("Goal updated");
  };

  const achievedPct = (g) => {
    const current = g.type === "completed_high" ? goalStats.completedHigh : goalStats.completed;
    const ratio = g.target > 0 ? Math.min(1, current / g.target) : 0;
    return Math.round(ratio * 100);
  };

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
            <span className="template-label">Quick start:</span>
            {GOAL_TEMPLATES.map((t) => (
              <button
                key={t.title}
                type="button"
                className="goal-template-chip"
                onClick={() => {
                  setNewGoalTitle(t.title);
                  setNewGoalType(t.type);
                  setNewGoalTarget(t.target);
                }}
              >
                {t.title}
              </button>
            ))}
          </div>
          <form className="goals-form" onSubmit={handleAddGoal}>
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
                <select
                  className="edit-select"
                  value={newGoalType}
                  onChange={(e) => setNewGoalType(e.target.value)}
                >
                  <option value="completed_all">Completed tasks</option>
                  <option value="completed_high">Completed high priority</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Target</label>
                <input
                  className="edit-input"
                  type="number"
                  min={1}
                  step={1}
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Due date (optional)</label>
                <input
                  className="edit-input"
                  type="date"
                  value={newGoalDueDate}
                  onChange={(e) => setNewGoalDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="goals-form-actions">
              <button className="action-button primary" type="submit">
                Add Goal
              </button>
            </div>
          </form>
        </div>

        <div className="goals-panel">
          <div className="goals-panel-title">Your goals</div>
          {goals.length === 0 ? (
            <div className="empty-state">No goals yet. Create one to start tracking.</div>
          ) : (
            <div className="goals-list">
              {goals.map((g) => {
                const pct = achievedPct(g);
                const current = g.type === "completed_high" ? goalStats.completedHigh : goalStats.completed;
                return (
                  <div key={g.id} className="goal-card">
                    <div className="goal-card-top">
                      <div className="goal-card-title">{g.title}</div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {pct >= 100 ? <span className="goal-meta-pill">Achieved</span> : null}
                        <button
                          type="button"
                          className="action-button"
                          onClick={() => setEditingGoal(g)}
                        >
                          Edit
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
      {editingGoal ? (
        <div className="modal-overlay" onClick={() => setEditingGoal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                <div className="form-row">
                  <div className="form-group">
                    <label>Goal title</label>
                    <input className="edit-input" name="title" defaultValue={editingGoal.title} required />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select className="edit-select" name="type" defaultValue={editingGoal.type}>
                      <option value="completed_all">Completed tasks</option>
                      <option value="completed_high">Completed high priority</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Target</label>
                    <input
                      className="edit-input"
                      type="number"
                      name="target"
                      min={1}
                      step={1}
                      defaultValue={editingGoal.target}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Due date (optional)</label>
                    <input
                      className="edit-input"
                      type="date"
                      name="dueDate"
                      defaultValue={editingGoal.dueDate || ""}
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="action-button" onClick={() => setEditingGoal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default GoalsView;
