import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import "./DashboardView.css";

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const dayStartMs = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const priorityRank = (p) => {
  const key = String(p || "Medium").toLowerCase();
  if (key === "high") return 0;
  if (key === "medium") return 1;
  return 2;
};

function DonutChart({
  segments,
  size = 132,
  stroke = 12,
  trackColor = "rgba(255,255,255,0.08)",
  centerText,
  subText,
}) {
  const total = segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = Math.min(3.5, stroke * 0.35);
  const defaultCenter =
    total === 0
      ? "—"
      : Math.round((segments[0]?.value ? (segments[0].value / total) * 100 : 0)) + "%";
  const defaultSub = total === 0 ? "No tasks" : "done";

  const normalized = segments
    .map((s) => ({
      label: s.label,
      value: Math.max(0, Number(s.value) || 0),
      color: s.color,
    }))
    .filter((s) => s.value > 0);

  const arcs = total > 0 ? normalized : [];
  const arcsWithOffset = arcs.reduce(
    (state, s) => {
      const arcLen = (s.value / total) * c;
      return {
        offset: state.offset + arcLen,
        list: [...state.list, { ...s, arcLen, offset: state.offset }],
      };
    },
    { offset: 0, list: [] }
  ).list;

  return (
    <svg
      className="dashboard-donut"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={trackColor}
        strokeWidth={stroke}
      />
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {arcsWithOffset.map((s) => {
          const dash = Math.max(0, s.arcLen - gap);
          const dasharray = `${dash} ${c - dash}`;
          const dashoffset = -s.offset;
          return (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
            />
          );
        })}
      </g>
      <text x="50%" y="49%" textAnchor="middle" className="dashboard-donut-center">
        {centerText ?? defaultCenter}
      </text>
      <text x="50%" y="64%" textAnchor="middle" className="dashboard-donut-sub">
        {subText ?? defaultSub}
      </text>
    </svg>
  );
}

function DashboardView({ todos, onGoBoard, onOpenTask, onToggleComplete }) {
  const { t: translate } = useTranslation();
  // --- Stats Calculation ---
  const totalTasks = todos.length;
  const completedTasks = todos.filter((t) => t.isComplete).length;
  const pendingTasks = totalTasks - completedTasks;

  const today = new Date();

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

  const dueCounts = useMemo(() => {
    const memoTodayStartMs = dayStartMs(new Date());
    const res = { Overdue: 0, Today: 0, Week: 0, Later: 0, None: 0 };
    for (const t of todos) {
      if (t.isComplete) continue;
      if (!t.dueDate) {
        res.None += 1;
        continue;
      }
      const d = new Date(t.dueDate);
      const dStartMs = dayStartMs(d);
      if (dStartMs < memoTodayStartMs) res.Overdue += 1;
      else if (dStartMs === memoTodayStartMs) res.Today += 1;
      else {
        const diffDays = (dStartMs - memoTodayStartMs) / (1000 * 60 * 60 * 24);
        if (diffDays < 7) res.Week += 1;
        else res.Later += 1;
      }
    }
    return res;
  }, [todos]);

  const overdueTasks = useMemo(() => {
    const nowStartMs = dayStartMs(new Date());
    return todos
      .filter((t) => !t.isComplete && t.dueDate)
      .slice()
      .sort((a, b) => {
        const ad = new Date(a.dueDate);
        const bd = new Date(b.dueDate);
        const aStart = dayStartMs(ad);
        const bStart = dayStartMs(bd);
        if (aStart !== bStart) return aStart - bStart;
        const pr = priorityRank(a.priority) - priorityRank(b.priority);
        if (pr !== 0) return pr;
        return String(a.name || "").localeCompare(String(b.name || ""));
      })
      .filter((t) => dayStartMs(new Date(t.dueDate)) < nowStartMs)
      .slice(0, 5);
  }, [todos]);

  const weeklyWorkload = useMemo(() => {
    const baseMs = dayStartMs(new Date());
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(baseMs + i * 24 * 60 * 60 * 1000);
      return {
        key: String(baseMs + i * 24 * 60 * 60 * 1000),
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        count: 0,
      };
    });

    for (const t of todos) {
      if (t.isComplete) continue;
      if (!t.dueDate) continue;
      const dMs = dayStartMs(new Date(t.dueDate));
      const idx = Math.floor((dMs - baseMs) / (24 * 60 * 60 * 1000));
      if (idx >= 0 && idx < 7) days[idx].count += 1;
    }

    const max = days.reduce((m, d) => Math.max(m, d.count), 0);
    const total = days.reduce((s, d) => s + d.count, 0);
    return { days, max, total };
  }, [todos]);

  const nextUp = useMemo(() => {
    const items = todos
      .filter((t) => !t.isComplete)
      .slice()
      .sort((a, b) => {
        const ad = a.dueDate ? new Date(a.dueDate) : null;
        const bd = b.dueDate ? new Date(b.dueDate) : null;
        if (ad && bd) {
          const aStart = dayStartMs(ad);
          const bStart = dayStartMs(bd);
          if (aStart !== bStart) return aStart - bStart;
        } else if (ad && !bd) return -1;
        else if (!ad && bd) return 1;

        const pr = priorityRank(a.priority) - priorityRank(b.priority);
        if (pr !== 0) return pr;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
    return items.slice(0, 5);
  }, [todos]);

  const progressSegments = useMemo(
    () => [
      { label: translate("dashboard.progress.completed"), value: completedTasks, color: "rgba(52, 211, 153, 0.95)" },
      { label: translate("dashboard.progress.inProgress"), value: pendingTasks, color: "rgba(96, 165, 250, 0.9)" },
    ],
    [completedTasks, pendingTasks, translate]
  );

  const prioritySegments = useMemo(
    () => [
      { label: translate("dashboard.priority.high"), value: priorityCounts.High, color: "rgba(248, 113, 113, 0.95)" },
      { label: translate("dashboard.priority.medium"), value: priorityCounts.Medium, color: "rgba(250, 204, 21, 0.9)" },
      { label: translate("dashboard.priority.low"), value: priorityCounts.Low, color: "rgba(96, 165, 250, 0.9)" },
    ],
    [priorityCounts, translate]
  );

  const dueSegments = useMemo(
    () => [
      { label: translate("dashboard.due.overdue"), value: dueCounts.Overdue, color: "rgba(248, 113, 113, 0.95)" },
      { label: translate("dashboard.due.today"), value: dueCounts.Today, color: "rgba(251, 191, 36, 0.95)" },
      { label: translate("dashboard.due.thisWeek"), value: dueCounts.Week, color: "rgba(96, 165, 250, 0.9)" },
      { label: translate("dashboard.due.later"), value: dueCounts.Later, color: "rgba(148, 163, 184, 0.8)" },
      { label: translate("dashboard.due.noDueDate"), value: dueCounts.None, color: "rgba(99, 102, 241, 0.8)" },
    ],
    [dueCounts, translate]
  );

  return (
    <div className="board-card">
      <div className="board-header">
        <div>
          <div className="board-title">{translate("dashboard.title")}</div>
          <div className="board-subtitle">
            {translate("dashboard.subtitle")}
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
              <h3 className="dashboard-summary-title">{translate("dashboard.summary.inbox.title")}</h3>
              <p className="dashboard-summary-subtitle">
                {translate("dashboard.summary.inbox.subtitle")}
              </p>
            </div>
            <div className="dashboard-summary-count">{inboxCount}</div>
          </div>
          <button className="dashboard-summary-cta" onClick={() => (onGoBoard ? onGoBoard("pending") : null)}>
            {translate("dashboard.actions.viewBoard")} <span aria-hidden="true">&rarr;</span>
          </button>
        </div>

        {/* Today */}
        <div className="dashboard-summary-card purple">
          <div className="dashboard-summary-header">
            <div>
              <h3 className="dashboard-summary-title">{translate("dashboard.summary.today.title")}</h3>
              <p className="dashboard-summary-subtitle">
                {translate("dashboard.summary.today.subtitle")}
              </p>
            </div>
            <div className="dashboard-summary-count">{todayCount}</div>
          </div>
          <button className="dashboard-summary-cta" onClick={() => (onGoBoard ? onGoBoard("due_today") : null)}>
            {translate("dashboard.actions.focusNow")} <span aria-hidden="true">&rarr;</span>
          </button>
        </div>

        {/* This Week */}
        <div className="dashboard-summary-card yellow">
          <div className="dashboard-summary-header">
            <div>
              <h3 className="dashboard-summary-title">{translate("dashboard.summary.thisWeek.title")}</h3>
              <p className="dashboard-summary-subtitle">
                {translate("dashboard.summary.thisWeek.subtitle")}
              </p>
            </div>
            <div className="dashboard-summary-count">{thisWeekCount}</div>
          </div>
          <button className="dashboard-summary-cta" onClick={() => (onGoBoard ? onGoBoard("due_week") : null)}>
            {translate("dashboard.actions.seeSchedule")} <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </div>

      {/* 2. Detailed Stats Grid */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-label">{translate("dashboard.stats.totalTasks")}</div>
          <div className="dashboard-card-number">{totalTasks}</div>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-label">{translate("dashboard.stats.completed")}</div>
          <div className="dashboard-card-number">{completedTasks}</div>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-label">{translate("dashboard.stats.inProgress")}</div>
          <div className="dashboard-card-number">{pendingTasks}</div>
        </div>
      </div>

      {/* 3. Priority Distribution */}
      <div className="dashboard-grid dashboard-grid-wide">
        <div className="dashboard-card dashboard-chart-card">
          <div className="dashboard-card-label">{translate("dashboard.charts.taskProgress")}</div>
          <div className="dashboard-chart-row">
            <DonutChart
              segments={progressSegments}
              centerText={totalTasks === 0 ? "—" : Math.round((completedTasks / totalTasks) * 100) + "%"}
              subText={totalTasks === 0 ? translate("dashboard.misc.noTasks") : translate("dashboard.misc.done")}
            />
            <div className="dashboard-legend">
              {progressSegments.map((s) => (
                <div key={s.label} className="dashboard-legend-item">
                  <span className="dashboard-legend-dot" style={{ background: s.color }} />
                  <span className="dashboard-legend-label">{s.label}</span>
                  <span className="dashboard-legend-value">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-label">{translate("dashboard.charts.tasksByPriority")}</div>
          <div className="dashboard-chart-row">
            <DonutChart
              segments={prioritySegments}
              centerText={String(totalTasks)}
              subText={translate("dashboard.misc.tasks")}
            />
            <div className="priority-bars">
              <div className="priority-bar-row">
                <span>{translate("dashboard.priority.high")}</span>
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
                <span>{translate("dashboard.priority.medium")}</span>
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
                <span>{translate("dashboard.priority.low")}</span>
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

      <div className="dashboard-grid dashboard-grid-wide dashboard-grid-spaced">
        <div className="dashboard-card dashboard-chart-card">
          <div className="dashboard-card-label">{translate("dashboard.charts.dueHealthPending")}</div>
          <div className="dashboard-chart-row">
            <DonutChart
              segments={dueSegments}
              centerText={String(dueCounts.Overdue)}
              subText={translate("dashboard.due.overdue")}
              trackColor="rgba(255,255,255,0.06)"
            />
            <div className="dashboard-legend">
              {dueSegments.map((s) => (
                <div key={s.label} className="dashboard-legend-item">
                  <span className="dashboard-legend-dot" style={{ background: s.color }} />
                  <span className="dashboard-legend-label">{s.label}</span>
                  <span className="dashboard-legend-value">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-card dashboard-nextup-card">
          <div className="dashboard-nextup-header">
            <div className="dashboard-card-label">{translate("dashboard.sections.nextUp")}</div>
            <button type="button" className="dashboard-mini-link" onClick={() => (onGoBoard ? onGoBoard("all") : null)}>
              {translate("dashboard.actions.openBoard")}
            </button>
          </div>
          {nextUp.length === 0 ? (
            <div className="dashboard-empty">{translate("dashboard.empty.noPendingTasks")}</div>
          ) : (
            <div className="dashboard-nextup-list">
              {nextUp.map((task) => {
                const due = task.dueDate ? new Date(task.dueDate) : null;
                const dueLabel = due
                  ? isSameDay(due, today)
                    ? translate("dashboard.due.today")
                    : due.toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  : translate("dashboard.due.noDueDate");
                const p = (task.priority || "Medium").toLowerCase();
                return (
                  <div
                    key={task.id}
                    className="dashboard-nextup-item"
                    role="button"
                    tabIndex={0}
                    onClick={() => (onOpenTask ? onOpenTask(task) : null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (onOpenTask) onOpenTask(task);
                      }
                    }}
                  >
                    <span className={`dashboard-priority-dot ${p}`} aria-hidden="true" />
                    <div className="dashboard-nextup-main">
                      <div className="dashboard-nextup-title">
                        {task.name || translate("dashboard.misc.untitledTask")}
                      </div>
                      <div className="dashboard-nextup-meta">{dueLabel}</div>
                    </div>
                    <div className="dashboard-item-actions">
                      <button
                        type="button"
                        className="dashboard-mini-link dashboard-mini-link-compact"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleComplete) onToggleComplete(task);
                        }}
                      >
                        {translate("dashboard.actions.done")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid-wide dashboard-grid-spaced">
        <div className="dashboard-card dashboard-week-card">
          <div className="dashboard-week-header">
            <div className="dashboard-card-label">{translate("dashboard.sections.thisWeekWorkload")}</div>
            <div className="dashboard-week-total">{weeklyWorkload.total}</div>
          </div>
          <div
            className="dashboard-week-bars"
            role="img"
            aria-label={translate("dashboard.aria.tasksDuePerDayThisWeek")}
          >
            {weeklyWorkload.days.map((d) => {
              const h =
                weeklyWorkload.max === 0
                  ? 6
                  : Math.max(6, Math.round((d.count / weeklyWorkload.max) * 64));
              return (
                <div key={d.key} className="dashboard-week-day">
                  <div className="dashboard-week-bar-wrap">
                    <div className="dashboard-week-bar" style={{ height: `${h}px` }} />
                  </div>
                  <div className="dashboard-week-label">{d.label}</div>
                  <div className="dashboard-week-count">{d.count}</div>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            className="dashboard-mini-link dashboard-week-cta"
            onClick={() => (onGoBoard ? onGoBoard("due_week") : null)}
          >
            {translate("dashboard.actions.openBoard")}
          </button>
        </div>

        <div className="dashboard-card dashboard-attention-card">
          <div className="dashboard-nextup-header">
            <div className="dashboard-card-label">{translate("dashboard.sections.needsAttention")}</div>
            <button type="button" className="dashboard-mini-link" onClick={() => (onGoBoard ? onGoBoard("pending") : null)}>
              {translate("dashboard.actions.openBoard")}
            </button>
          </div>

          <div className="dashboard-attention-metrics">
            <div className="dashboard-attention-metric">
              <div className="dashboard-attention-k">{translate("dashboard.due.overdue")}</div>
              <button
                type="button"
                className="dashboard-attention-v dashboard-attention-link"
                onClick={() => (onGoBoard ? onGoBoard("overdue") : null)}
              >
                {dueCounts.Overdue}
              </button>
            </div>
            <div className="dashboard-attention-metric">
              <div className="dashboard-attention-k">{translate("dashboard.due.noDueDate")}</div>
              <button
                type="button"
                className="dashboard-attention-v dashboard-attention-link"
                onClick={() => (onGoBoard ? onGoBoard("no_due") : null)}
              >
                {dueCounts.None}
              </button>
            </div>
          </div>

          {overdueTasks.length === 0 ? (
            <div className="dashboard-empty">{translate("dashboard.empty.noOverdueTasks")}</div>
          ) : (
            <div className="dashboard-attention-list">
              {overdueTasks.map((task) => (
                <div
                  key={task.id}
                  className="dashboard-attention-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => (onOpenTask ? onOpenTask(task) : null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (onOpenTask) onOpenTask(task);
                    }
                  }}
                >
                  <div className="dashboard-attention-title">
                    {task.name || translate("dashboard.misc.untitledTask")}
                  </div>
                  <div className="dashboard-attention-meta">
                    {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
