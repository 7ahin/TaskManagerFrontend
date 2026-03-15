import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "./BoardView.css";
import {
  DndContext,
  closestCorners,
  pointerWithin,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  ListBulletIcon, 
  Squares2X2Icon, 
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  ChevronDownIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  CheckIcon
} from "@heroicons/react/24/outline";

function CustomDatePicker({ value, onChange, placeholder }) {
  const { t: translate, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Format the date for display
  const displayDate = value ? new Date(value).toLocaleDateString(i18n.language, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : (placeholder ?? translate("board.dates.selectDate"));

  // Calendar logic
  const today = new Date();
  const [viewDate, setViewDate] = useState(value ? new Date(value) : today);
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const { daysInMonth, firstDayOfMonth } = getDaysInMonth(viewDate);
  
  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const paddingDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    paddingDays.push(i);
  }

  const daysOfWeek = Array.from({ length: 7 }, (_, i) =>
    new Date(2021, 7, 1 + i).toLocaleDateString(i18n.language, { weekday: "narrow" })
  );

  const changeMonth = (increment) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setViewDate(newDate);
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(viewDate);
    newDate.setDate(day);
    // Format to YYYY-MM-DD for input compatibility
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    onChange(`${year}-${month}-${dayStr}`);
    setIsOpen(false);
  };

  return (
    <div className="board-date-container">
      <div 
        className="board-date-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={`board-date-display-text ${!value ? "board-date-placeholder" : ""}`}>
          <CalendarIcon className="icon-sm" />
          <span>{displayDate}</span>
        </div>
        <ChevronDownIcon className="board-dropdown-chevron" />
      </div>

      {isOpen && (
        <>
          <div 
            style={{ position: "fixed", inset: 0, zIndex: 49, cursor: "default" }} 
            onClick={() => setIsOpen(false)}
          />
          <div className="board-calendar-popup">
            <div className="board-calendar-header">
              <button type="button" onClick={() => changeMonth(-1)} className="board-calendar-nav-btn">
                <ChevronLeftIcon className="icon-xs" />
              </button>
              <span className="board-calendar-month-year">
                {viewDate.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
              </span>
              <button type="button" onClick={() => changeMonth(1)} className="board-calendar-nav-btn">
                <ChevronRightIcon className="icon-xs" />
              </button>
            </div>
            <div className="board-calendar-grid-header">
              {daysOfWeek.map((d, i) => (
                <div key={`${d}-${i}`} className="board-calendar-day-name">{d}</div>
              ))}
            </div>
            <div className="board-calendar-grid">
              {paddingDays.map((p) => (
                <div key={`padding-${p}`} className="board-calendar-day padding" />
              ))}
              {days.map(day => {
                const isSelected = value && 
                  new Date(value).getDate() === day &&
                  new Date(value).getMonth() === viewDate.getMonth() &&
                  new Date(value).getFullYear() === viewDate.getFullYear();
                
                const isToday = 
                  today.getDate() === day &&
                  today.getMonth() === viewDate.getMonth() &&
                  today.getFullYear() === viewDate.getFullYear();

                return (
                  <div 
                    key={day} 
                    className={`board-calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => handleDateSelect(day)}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DateRangePopup({ startDate, dueDate, onStartChange, onDueChange }) {
  const { t: translate, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' });
  };

  const hasDates = startDate || dueDate;
  const label = hasDates 
    ? `${formatDate(startDate) || translate("board.dates.startShort")} - ${formatDate(dueDate) || translate("board.dates.dueShort")}`
    : translate("board.dates.dates");

  return (
    <div className="board-date-popup-wrapper">
      <button 
        type="button" 
        className={`board-date-popup-trigger ${hasDates ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="icon-sm" />
        <span>{label}</span>
      </button>

      {isOpen && (
        <>
          <div 
            style={{ position: "fixed", inset: 0, zIndex: 48, cursor: "default" }} 
            onClick={() => setIsOpen(false)} 
          />
          <div className="board-date-popup-panel">
            <div className="board-date-popup-row">
              <span className="board-date-popup-label">{translate("board.fields.startDate")}</span>
              <div className="board-date-popup-field">
                <CustomDatePicker 
                  value={startDate} 
                  onChange={onStartChange} 
                  placeholder={translate("board.dates.setStartDate")} 
                />
              </div>
            </div>
            <div className="board-date-popup-row">
              <span className="board-date-popup-label">{translate("board.fields.dueDate")}</span>
              <div className="board-date-popup-field">
                <CustomDatePicker 
                  value={dueDate} 
                  onChange={onDueChange} 
                  placeholder={translate("board.dates.setDueDate")} 
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CustomPriorityDropdown({ value, onChange }) {
  const { t: translate } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const priorities = ["Low", "Medium", "High"];

  const handleSelect = (p) => {
    onChange(p);
    setIsOpen(false);
  };

  return (
    <div className="board-dropdown-container">
      <button
        type="button"
        className="board-dropdown-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className={`board-priority-indicator ${value?.toLowerCase() || "medium"}`}></span>
          {translate(`board.priority.${String(value || "Medium").toLowerCase()}`)}
        </div>
        <ChevronDownIcon className="board-dropdown-chevron" />
      </button>

      {isOpen && (
        <>
          <div 
            style={{ position: "fixed", inset: 0, zIndex: 49, cursor: "default" }} 
            onClick={() => setIsOpen(false)}
          />
          <div className="board-dropdown-menu">
            {priorities.map((p) => (
              <div
                key={p}
                className={`board-dropdown-item ${value === p ? "selected" : ""}`}
                onClick={() => handleSelect(p)}
              >
                <span className={`board-priority-indicator ${p.toLowerCase()}`}></span>
                {translate(`board.priority.${p.toLowerCase()}`)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EditTaskModal({ todo, onClose, onSave }) {
  const { t: translate } = useTranslation();
  const [name, setName] = useState(todo.name);
  const [priority, setPriority] = useState(todo.priority || "Medium");
  const [isComplete, setIsComplete] = useState(!!todo.isComplete);
  const [dueDate, setDueDate] = useState(
    todo.dueDate ? new Date(todo.dueDate).toISOString().split("T")[0] : ""
  );
  const [startDate, setStartDate] = useState(
    todo.startDate ? new Date(todo.startDate).toISOString().split("T")[0] : ""
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...todo,
      name,
      priority,
      isComplete,
      dueDate: dueDate || null,
      startDate: startDate || null,
    });
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h3 className="modal-title">{translate("board.modal.editTask.title")}</h3>
            <div className="modal-subtitle">{translate("board.modal.editTask.subtitle")}</div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={translate("board.actions.close")}
          >
            <XMarkIcon className="icon-sm" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label className="edit-label">{translate("board.fields.taskName")}</label>
            <input
              type="text"
              className="edit-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={translate("board.placeholders.taskName")}
              autoFocus
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="edit-label">{translate("board.fields.status")}</label>
              <div className="edit-status-toggle" role="group" aria-label={translate("board.fields.status")}>
                <button
                  type="button"
                  className={`edit-status-btn ${!isComplete ? "active" : ""}`}
                  onClick={() => setIsComplete(false)}
                >
                  <span className="status-indicator working"></span>
                  {translate("board.status.inProgress")}
                </button>
                <button
                  type="button"
                  className={`edit-status-btn ${isComplete ? "active" : ""}`}
                  onClick={() => setIsComplete(true)}
                >
                  <span className="status-indicator done"></span>
                  {translate("board.status.done")}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="edit-label">{translate("board.fields.priority")}</label>
              <CustomPriorityDropdown
                value={priority}
                onChange={(val) => setPriority(val)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="edit-label">{translate("board.fields.startDate")}</label>
              <div className="edit-date-stack">
                <CustomDatePicker value={startDate} onChange={(val) => setStartDate(val)} />
                {startDate ? (
                  <button
                    type="button"
                    className="edit-clear-link"
                    onClick={() => setStartDate("")}
                  >
                    {translate("board.buttons.clear")}
                  </button>
                ) : null}
              </div>
            </div>
            <div className="form-group edit-date-align-right">
              <label className="edit-label">{translate("board.fields.dueDate")}</label>
              <div className="edit-date-stack">
                <CustomDatePicker value={dueDate} onChange={(val) => setDueDate(val)} />
                {dueDate ? (
                  <button
                    type="button"
                    className="edit-clear-link"
                    onClick={() => setDueDate("")}
                  >
                    {translate("board.buttons.clear")}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="action-button delete" onClick={onClose}>
              {translate("board.actions.cancel")}
            </button>
            <button type="submit" className="action-button primary">
              {translate("board.actions.saveChanges")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function SortableTaskCard({ todo, setPendingDeleteId, onToggleComplete, onEdit }) {
  const { t: translate, i18n } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`board-kanban-card ${todo.isComplete ? "completed" : ""}`}
      onClick={() => onEdit(todo)}
    >
      <div className="board-kanban-card-header">
        <span
          className={`board-priority-tag ${
            todo.priority?.toLowerCase() || "medium"
          }`}
        >
          {translate(`board.priority.${String(todo.priority || "Medium").toLowerCase()}`)}
        </span>
        <button
          className="board-card-action-btn delete"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setPendingDeleteId(todo.id);
          }}
          title={translate("board.actions.delete")}
        >
          &times;
        </button>
      </div>
      <h4 className="board-kanban-card-title">{todo.name}</h4>
      <div className="board-kanban-card-footer">
        <div className="board-card-dates">
          {todo.startDate && (
             <div className="board-card-date-item start-date" title={translate("board.fields.startDate")}>
               <span className="date-prefix">{translate("board.dates.startPrefix")}</span>
               <span>{new Date(todo.startDate).toLocaleDateString(i18n.language, {month: 'numeric', day: 'numeric'})}</span>
             </div>
          )}
          {todo.dueDate && (
             <div className="board-card-date-item due-date" title={translate("board.fields.dueDate")}>
               <ClockIcon className="icon-xs" />
               <span>{new Date(todo.dueDate).toLocaleDateString(i18n.language, {month: 'numeric', day: 'numeric'})}</span>
             </div>
          )}
          {!todo.startDate && !todo.dueDate && (
             <div className="board-card-date-item empty">
               <span className="date-placeholder">{translate("board.dates.noDates")}</span>
             </div>
          )}
        </div>
        <button
          className={todo.isComplete ? "board-card-mark-undone-btn" : "board-card-mark-done-btn"}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(todo);
          }}
        >
          {todo.isComplete ? (
            translate("board.buttons.undo")
          ) : (
            <>
              <CheckCircleIcon className="icon-sm" />
              {translate("board.buttons.done")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const STATUSES = ["Working on it", "Stuck", "Done", "Review"];

function DroppableColumn({ id, title, count, statusClass, items, children }) {
  const { t: translate } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={`board-kanban-column ${isOver ? "is-over" : ""}`}>
      <div className="board-kanban-header">
        <span className={`board-status-dot ${statusClass}`}></span>
        <h3>{title}</h3>
        <span className="board-count-badge">{count}</span>
      </div>
      <div className="board-kanban-list">
        <SortableContext
          items={items}
          strategy={verticalListSortingStrategy}
        >
          {children}
        </SortableContext>
        {items.length === 0 && (
          <div className="board-empty-kanban">{translate("board.empty.dropHere")}</div>
        )}
      </div>
    </div>
  );
}

function BoardView({
  todos,
  filteredTodos,
  search,
  setSearch,
  boardQuickFilter,
  setBoardQuickFilter,
  newTodoName,
  setNewTodoName,
  newPriority,
  setNewPriority,
  newDueDate,
  setNewDueDate,
  newStartDate,
  setNewStartDate,
  loading,
  error,
  onAddTodo,
  onUpdateTodo,
  onToggleComplete,
  onDelete,
}) {
  const { t: translate, i18n } = useTranslation();
  const [viewMode, setViewMode] = useState("kanban"); // 'list' or 'kanban'
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [editingTodo, setEditingTodo] = useState(null);
  const [activeId, setActiveId] = useState(null); // For DragOverlay

  const statusKeyOf = (status) => {
    if (status === "Working on it") return "workingOnIt";
    if (status === "Stuck") return "stuck";
    if (status === "Done") return "done";
    return "review";
  };

  const quickFilters = [
    { key: "all", label: translate("board.filters.all") },
    { key: "pending", label: translate("board.filters.pending") },
    { key: "completed", label: translate("board.filters.completed") },
    { key: "overdue", label: translate("board.filters.overdue") },
    { key: "due_today", label: translate("board.filters.dueToday") },
    { key: "due_week", label: translate("board.filters.dueWeek") },
    { key: "no_due", label: translate("board.filters.noDue") },
    { key: "high_priority", label: translate("board.filters.highPriority") },
  ];

  const pendingDelete =
    pendingDeleteId != null
      ? todos.find((t) => t.id === pendingDeleteId) ?? null
      : null;

  const handleSaveEdit = (updatedTodo) => {
    onUpdateTodo(updatedTodo);
    setEditingTodo(null);
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const collisionDetectionStrategy = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return closestCorners(args);
  };

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = todos.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check if dropped on a column
    const statusColumn = STATUSES.find(s => s === over.id);
    
    if (statusColumn) {
        if (activeTask.status !== statusColumn) {
            onUpdateTodo({
                ...activeTask,
                status: statusColumn,
                isComplete: statusColumn === "Done"
            });
        }
        return;
    }

    // Dropped on another task? 
    // We need to find which column that task belongs to
    const overTask = todos.find((t) => t.id === over.id);
    if (overTask && overTask.status !== activeTask.status) {
         onUpdateTodo({
            ...activeTask,
            status: overTask.status,
            isComplete: overTask.status === "Done"
        });
    }
  }

  // Find the item being dragged for Overlay
  const activeOverlayTask = activeId ? todos.find(t => t.id === activeId) : null;

  return (
    <section className="board-view-container">
        <div className="board-view-header">
            <div>
            <div className="board-view-title">{translate("board.title")}</div>
            <div className="board-view-subtitle">
                {translate("board.subtitle")}
            </div>
            </div>
            
            <div className="board-controls">
                <div className="board-view-toggle">
                    <button 
                        className={`board-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        data-tooltip={translate("board.view.listTooltip")}
                    >
                        <ListBulletIcon className="icon-sm" />
                    </button>
                    <button 
                        className={`board-view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                        onClick={() => setViewMode('kanban')}
                        data-tooltip={translate("board.view.kanbanTooltip")}
                    >
                        <Squares2X2Icon className="icon-sm" />
                    </button>
                </div>
                <input
                className="board-search-input"
                type="search"
                placeholder={translate("board.search.placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>

        <div className="board-filter-row" role="toolbar" aria-label={translate("board.filters.ariaLabel")}>
          {quickFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`board-filter-chip ${boardQuickFilter === f.key ? "active" : ""}`}
              onClick={() => {
                if (setBoardQuickFilter) setBoardQuickFilter(f.key);
              }}
            >
              {f.label}
            </button>
          ))}
          {boardQuickFilter !== "all" || (search && search.trim()) ? (
            <button
              type="button"
              className="board-filter-clear"
              onClick={() => {
                if (setBoardQuickFilter) setBoardQuickFilter("all");
                setSearch("");
              }}
            >
              {translate("board.filters.clear")}
            </button>
          ) : null}
        </div>

        <form className="board-add-row" onSubmit={onAddTodo}>
            <input
            className="board-add-input"
            type="text"
            value={newTodoName}
            onChange={(e) => setNewTodoName(e.target.value)}
            placeholder={translate("board.add.placeholder")}
            />
            <div className="board-add-controls">
              <CustomPriorityDropdown
                value={newPriority}
                onChange={(val) => setNewPriority(val)}
              />
              <DateRangePopup
                startDate={newStartDate}
                dueDate={newDueDate}
                onStartChange={setNewStartDate}
                onDueChange={setNewDueDate}
              />
              <button className="board-add-button" type="submit">
              {translate("board.add.button")}
              </button>
            </div>
        </form>

        {error && <div className="error-text">{error}</div>}

        {viewMode === 'list' ? (
        <div className="board-view-table-wrapper">
            <table className="board-view-table">
            <thead>
                <tr>
                <th className="board-checkbox-cell"></th>
                <th className="text-left">{translate("board.table.item")}</th>
                <th className="text-center">{translate("board.table.priority")}</th>
                <th className="text-center">{translate("board.table.dueDate")}</th>
                <th className="text-center">{translate("board.table.status")}</th>
                <th className="board-actions-cell text-right">{translate("board.table.actions")}</th>
                </tr>
            </thead>
            <tbody>
                {filteredTodos.map((todo) => (
                    <tr key={todo.id}>
                    <td className="board-checkbox-cell" onClick={() => onToggleComplete(todo)}>
                        <div className={`board-checkbox-custom ${todo.isComplete ? "checked" : ""}`}>
                            <CheckIcon className="board-checkbox-icon" strokeWidth={3} />
                        </div>
                    </td>
                    <td>
                        <span
                        className={
                            "board-item-name" + (todo.isComplete ? " completed" : "")
                        }
                        >
                        {todo.name}
                        </span>
                    </td>
                    <td className="text-center">
                        <span
                        className={`board-status-pill priority-${(
                            todo.priority || "Medium"
                        ).toLowerCase()}`}
                        >
                        {translate(`board.priority.${String(todo.priority || "Medium").toLowerCase()}`)}
                        </span>
                    </td>
                    <td className="text-center">
                        {todo.dueDate
                        ? new Date(todo.dueDate).toLocaleDateString(i18n.language)
                        : "—"}
                    </td>
                    <td className="text-center">
                        <span
                        className={
                            "board-status-pill " +
                            (todo.isComplete ? "done" : "working")
                        }
                        >
                        {todo.isComplete ? translate("board.status.done") : translate("board.status.workingOnIt")}
                        </span>
                    </td>
                    <td className="board-actions-cell text-right">
                        <button
                        className="action-button"
                        onClick={() => setEditingTodo(todo)}
                        >
                        {translate("board.actions.edit")}
                        </button>
                        <button
                        className="action-button delete"
                        onClick={() => setPendingDeleteId(todo.id)}
                        >
                        {translate("board.actions.delete")}
                        </button>
                    </td>
                    </tr>
                ))}
            </tbody>
            </table>
            
            {filteredTodos.length === 0 && !loading && (
              <div className="board-empty-state">
                <div className="empty-state-icon-wrapper">
                  <ClipboardDocumentListIcon className="empty-state-icon" />
                </div>
                <h3 className="empty-state-title">{translate("board.empty.noTasksFound")}</h3>
                <p className="empty-state-description">
                  {search 
                    ? translate("board.empty.noMatch", { search }) 
                    : translate("board.empty.emptyList")}
                </p>
              </div>
            )}
        </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetectionStrategy}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="board-kanban-scroll-container">
              {STATUSES.map((status) => {
                const statusItems = filteredTodos.filter(
                  (t) => (t.status || "Working on it") === status
                );
                // Map status to a color class for the header dot
                let dotClass = "working"; // default
                if (status === "Done") dotClass = "done";
                else if (status === "Stuck") dotClass = "stuck";
                else if (status === "Review") dotClass = "review";

                return (
                  <DroppableColumn
                    key={status}
                    id={status}
                    title={translate(`board.status.${statusKeyOf(status)}`)}
                    count={statusItems.length}
                    statusClass={dotClass}
                    items={statusItems}
                  >
                    {statusItems.map((todo) => (
                      <SortableTaskCard
                        key={todo.id}
                        todo={todo}
                        setPendingDeleteId={setPendingDeleteId}
                        onToggleComplete={onToggleComplete}
                        onEdit={setEditingTodo}
                      />
                    ))}
                  </DroppableColumn>
                );
              })}
            </div>
            <DragOverlay>
              {activeOverlayTask ? (
                <div className="board-kanban-card dragging">
                  <h4>{activeOverlayTask.name}</h4>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {pendingDelete && createPortal(
            <div className="modal-overlay" onClick={() => setPendingDeleteId(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div className="modal-title-wrap">
                    <h3 className="modal-title">{translate("board.modal.deleteTask.title")}</h3>
                    <div className="modal-subtitle">{translate("board.modal.deleteTask.subtitle")}</div>
                  </div>
                  <button type="button" className="modal-close-btn" onClick={() => setPendingDeleteId(null)}>
                    <XMarkIcon className="icon-sm" />
                  </button>
                </div>
                <p style={{ color: "var(--text-main)", marginBottom: "1.5rem" }}>
                  {translate("board.modal.deleteTask.confirmPrefix")}
                  <strong style={{ color: "#fff" }}>"{pendingDelete.name}"</strong>
                  {translate("board.modal.deleteTask.confirmSuffix")}
                </p>
                <div className="modal-actions">
                <button
                    className="action-button secondary"
                    onClick={() => setPendingDeleteId(null)}
                >
                    {translate("board.actions.cancel")}
                </button>
                <button
                    className="action-button delete"
                    onClick={() => {
                    onDelete(pendingDelete);
                    setPendingDeleteId(null);
                    }}
                >
                    {translate("board.actions.delete")}
                </button>
                </div>
            </div>
            </div>,
            document.body
        )}

        {editingTodo && (
            <EditTaskModal
            todo={editingTodo}
            onClose={() => setEditingTodo(null)}
            onSave={handleSaveEdit}
            />
        )}
    </section>
  );
}

export default BoardView;
