import { useMemo } from "react";
import "./DashboardView.css";

function DashboardView({ todos, onGoBoard }) {
  // --- Stats Calculation ---
  const totalTasks = todos.length;
  const completedTasks = todos.filter((t) => t.isComplete).length;
  const pendingTasks = totalTasks - completedTasks;

  const priorityCounts = useMemo(() => {
    const result = { Low: 0, Medium: 0, High: 0 };
    for (const t of todos) {
      const key = t.priority || "Medium";
      if (result[key] !== undefined) {
        result[key] += 1;
      }
    }
    return result;
  }, [todos]);

  // --- HomeView Logic (Inbox, Today, This Week) ---
  const inboxCount = todos.filter((t) => !t.isComplete).length;

  const today = new Date();
  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const todayCount = todos.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return isSameDay(d, today);
  }).length;

  const thisWeekCount = todos.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    // Simple difference in days
    const diffTime = d - today;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays < 7;
  }).length;

  return (
    <div className="board-card">
      <div className="board-header">
        <div>
          <div className="board-title">Dashboard</div>
          <div className="board-subtitle">
            Overview of your tasks, priorities, and schedule.
          </div>
        </div>
        <div>
           {/* Optional header actions */}
        </div>
      </div>

      {/* 1. Summary Cards (Inbox, Today, This Week) */}
      <div className="dashboard-overview-grid">
        {/* Inbox */}
        <div className="dashboard-summary-card blue">
          <div className="dashboard-summary-header">
            <div>
              <h3 className="dashboard-summary-title">Inbox</h3>
              <p className="dashboard-summary-subtitle">
                Pending tasks needing attention
              </p>
            </div>
            <div className="dashboard-summary-count">{inboxCount}</div>
          </div>
          <button className="dashboard-summary-cta" onClick={onGoBoard}>
            View Board &rarr;
          </button>
        </div>

        {/* Today */}
        <div className="dashboard-summary-card purple">
          <div className="dashboard-summary-header">
            <div>
              <h3 className="dashboard-summary-title">Today</h3>
              <p className="dashboard-summary-subtitle">
                Tasks scheduled for today
              </p>
            </div>
            <div className="dashboard-summary-count">{todayCount}</div>
          </div>
          <button className="dashboard-summary-cta" onClick={onGoBoard}>
            Focus Now &rarr;
          </button>
        </div>

        {/* This Week */}
        <div className="dashboard-summary-card yellow">
          <div className="dashboard-summary-header">
            <div>
              <h3 className="dashboard-summary-title">This Week</h3>
              <p className="dashboard-summary-subtitle">
                Upcoming in next 7 days
              </p>
            </div>
            <div className="dashboard-summary-count">{thisWeekCount}</div>
          </div>
          <button className="dashboard-summary-cta" onClick={onGoBoard}>
            See Schedule &rarr;
          </button>
        </div>
      </div>

      {/* 2. Detailed Stats Grid */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-label">Total Tasks</div>
          <div className="dashboard-card-number">{totalTasks}</div>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-label">Completed</div>
          <div className="dashboard-card-number">{completedTasks}</div>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-label">In Progress</div>
          <div className="dashboard-card-number">{pendingTasks}</div>
        </div>
      </div>

      {/* 3. Priority Distribution */}
      <div className="dashboard-grid dashboard-grid-wide">
        <div className="dashboard-card">
          <div className="dashboard-card-label">Tasks by Priority</div>
          <div className="priority-bars" style={{ marginTop: "1rem" }}>
            <div className="priority-bar-row">
              <span>High</span>
              <div className="priority-bar-track">
                <div
                  className="priority-bar-fill high"
                  style={{
                    width:
                      totalTasks === 0
                        ? "0%"
                        : `${(priorityCounts.High / totalTasks) * 100}%`,
                  }}
                />
              </div>
              <span className="priority-bar-count">{priorityCounts.High}</span>
            </div>
            <div className="priority-bar-row">
              <span>Medium</span>
              <div className="priority-bar-track">
                <div
                  className="priority-bar-fill medium"
                  style={{
                    width:
                      totalTasks === 0
                        ? "0%"
                        : `${(priorityCounts.Medium / totalTasks) * 100}%`,
                  }}
                />
              </div>
              <span className="priority-bar-count">{priorityCounts.Medium}</span>
            </div>
            <div className="priority-bar-row">
              <span>Low</span>
              <div className="priority-bar-track">
                <div
                  className="priority-bar-fill low"
                  style={{
                    width:
                      totalTasks === 0
                        ? "0%"
                        : `${(priorityCounts.Low / totalTasks) * 100}%`,
                  }}
                />
              </div>
              <span className="priority-bar-count">{priorityCounts.Low}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
