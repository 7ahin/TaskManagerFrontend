import { useEffect, useState } from "react";
import "./BoardView.css";
import {
  DndContext,
  closestCorners,
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
  ChevronRightIcon
} from "@heroicons/react/24/outline";

function CustomDatePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Format the date for display
  const displayDate = value ? new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : "Select Date";

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
                {viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </span>
              <button type="button" onClick={() => changeMonth(1)} className="board-calendar-nav-btn">
                <ChevronRightIcon className="icon-xs" />
              </button>
            </div>
            <div className="board-calendar-grid-header">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
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

function CustomPriorityDropdown({ value, onChange }) {
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
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className={`board-priority-indicator ${value?.toLowerCase() || "medium"}`}></span>
          {value || "Medium"}
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
                {p}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EditTaskModal({ todo, onClose, onSave }) {
  const [name, setName] = useState(todo.name);
  const [priority, setPriority] = useState(todo.priority || "Medium");
  const [isComplete, setIsComplete] = useState(!!todo.isComplete);
  const [dueDate, setDueDate] = useState(
    todo.dueDate ? new Date(todo.dueDate).toISOString().split("T")[0] : ""
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
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h3 className="modal-title">Edit Task</h3>
            <div className="modal-subtitle">Update name, priority, due date, and status.</div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <XMarkIcon className="icon-sm" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label>Task Name</label>
            <input
              type="text"
              className="edit-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Give your task a clear name"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <div className="edit-status-toggle" role="group" aria-label="Status">
              <button
                type="button"
                className={`edit-status-btn ${!isComplete ? "active" : ""}`}
                onClick={() => setIsComplete(false)}
              >
                In progress
              </button>
              <button
                type="button"
                className={`edit-status-btn ${isComplete ? "active" : ""}`}
                onClick={() => setIsComplete(true)}
              >
                Done
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <div style={{ width: "100%" }}>
                <CustomPriorityDropdown
                  value={priority}
                  onChange={(val) => setPriority(val)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <div className="edit-date-stack">
                <CustomDatePicker value={dueDate} onChange={(val) => setDueDate(val)} />
                {dueDate ? (
                  <button
                    type="button"
                    className="edit-clear-link"
                    onClick={() => setDueDate("")}
                  >
                    Clear date
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="action-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="action-button primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SortableTaskCard({ todo, setPendingDeleteId, onToggleComplete, onEdit }) {
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
          {todo.priority || "Medium"}
        </span>
        <button
          className="board-card-action-btn delete"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setPendingDeleteId(todo.id);
          }}
          title="Delete"
        >
          &times;
        </button>
      </div>
      <h4 className="board-kanban-card-title">{todo.name}</h4>
      <div className="board-kanban-card-footer">
        <div className="board-card-due-date">
          <ClockIcon className="icon-xs" />
          <span>
            {todo.dueDate
              ? new Date(todo.dueDate).toLocaleDateString()
              : "No date"}
          </span>
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
            "Undo"
          ) : (
            <>
              <CheckCircleIcon className="icon-sm" />
              Done
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function DroppableColumn({ id, title, count, statusClass, items, children }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="board-kanban-column">
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
          <div className="board-empty-kanban">Drop items here</div>
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
  newTodoName,
  setNewTodoName,
  newPriority,
  setNewPriority,
  newDueDate,
  setNewDueDate,
  loading,
  error,
  onAddTodo,
  onUpdateTodo,
  onToggleComplete,
  onDelete,
}) {
  const [viewMode, setViewMode] = useState("kanban"); // 'list' or 'kanban'
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [editingTodo, setEditingTodo] = useState(null);
  const [activeId, setActiveId] = useState(null); // For DragOverlay

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

  const activeTasks = filteredTodos.filter((t) => !t.isComplete);
  const completedTasks = filteredTodos.filter((t) => t.isComplete);

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = todos.find((t) => t.id === active.id);
    if (!activeTask) return;

    let isOverCompleted = false;

    if (over.id === "completed-column") {
      isOverCompleted = true;
    } else if (over.id === "active-column") {
      isOverCompleted = false;
    } else {
      // Over a task
      const overTask = todos.find((t) => t.id === over.id);
      if (overTask) {
        isOverCompleted = overTask.isComplete;
      } else {
          // Fallback if over unknown item (shouldn't happen)
          return; 
      }
    }

    if (activeTask.isComplete !== isOverCompleted) {
      onToggleComplete(activeTask);
    }
  }

  // Find the item being dragged for Overlay
  const activeOverlayTask = activeId ? todos.find(t => t.id === activeId) : null;

  return (
    <section className="board-view-container">
        <div className="board-view-header">
            <div>
            <div className="board-view-title">High Level Overview</div>
            <div className="board-view-subtitle">
                Inspired by Monday-style boards: items, status, quick actions
            </div>
            </div>
            
            <div className="board-controls">
                <div className="board-view-toggle">
                    <button 
                        className={`board-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title="List View"
                    >
                        <ListBulletIcon className="icon-sm" />
                    </button>
                    <button 
                        className={`board-view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                        onClick={() => setViewMode('kanban')}
                        title="Kanban Board"
                    >
                        <Squares2X2Icon className="icon-sm" />
                    </button>
                </div>
                <input
                className="board-search-input"
                type="search"
                placeholder="Search tasks"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>

        <form className="board-add-row" onSubmit={onAddTodo}>
            <input
            className="board-add-input"
            type="text"
            value={newTodoName}
            onChange={(e) => setNewTodoName(e.target.value)}
            placeholder="Add a new task"
            />
            <CustomPriorityDropdown
              value={newPriority}
              onChange={(val) => setNewPriority(val)}
            />
            <CustomDatePicker
              value={newDueDate}
              onChange={(val) => setNewDueDate(val)}
            />
            <button className="board-add-button" type="submit">
            + Add Task
            </button>
        </form>

        {error && <div className="error-text">{error}</div>}

        {viewMode === 'list' ? (
        <div className="board-view-table-wrapper">
            <table className="board-view-table">
            <thead>
                <tr>
                <th className="board-checkbox-cell"></th>
                <th>Item</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Status</th>
                <th className="board-actions-cell">Actions</th>
                </tr>
            </thead>
            <tbody>
                {filteredTodos.length === 0 && !loading ? (
                <tr>
                    <td colSpan={6} className="empty-state">
                    No tasks to show. Add one above to get started.
                    </td>
                </tr>
                ) : (
                filteredTodos.map((todo) => (
                    <tr key={todo.id}>
                    <td className="board-checkbox-cell">
                        <input
                        className="board-checkbox-input"
                        type="checkbox"
                        checked={todo.isComplete}
                        onChange={() => onToggleComplete(todo)}
                        />
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
                    <td>
                        <span
                        className={`board-status-pill priority-${(
                            todo.priority || "Medium"
                        ).toLowerCase()}`}
                        >
                        {todo.priority || "Medium"}
                        </span>
                    </td>
                    <td>
                        {todo.dueDate
                        ? new Date(todo.dueDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                        <span
                        className={
                            "board-status-pill " +
                            (todo.isComplete ? "done" : "working")
                        }
                        >
                        {todo.isComplete ? "Done" : "Working on it"}
                        </span>
                    </td>
                    <td className="board-actions-cell">
                        <button
                        className="action-button"
                        onClick={() => setEditingTodo(todo)}
                        >
                        Edit
                        </button>
                        <button
                        className="action-button delete"
                        onClick={() => setPendingDeleteId(todo.id)}
                        >
                        Delete
                        </button>
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="board-kanban-board">
              {/* Active Column */}
              <DroppableColumn
                id="active-column"
                title="Active"
                count={activeTasks.length}
                statusClass="working"
                items={activeTasks}
              >
                {activeTasks.map((todo) => (
                  <SortableTaskCard
                    key={todo.id}
                    todo={todo}
                    setPendingDeleteId={setPendingDeleteId}
                    onToggleComplete={onToggleComplete}
                    onEdit={setEditingTodo}
                  />
                ))}
              </DroppableColumn>

              {/* Completed Column */}
              <DroppableColumn
                id="completed-column"
                title="Completed"
                count={completedTasks.length}
                statusClass="done"
                items={completedTasks}
              >
                {completedTasks.map((todo) => (
                  <SortableTaskCard
                    key={todo.id}
                    todo={todo}
                    setPendingDeleteId={setPendingDeleteId}
                    onToggleComplete={onToggleComplete}
                    onEdit={setEditingTodo}
                  />
                ))}
              </DroppableColumn>
              
              <DragOverlay>
                {activeId ? (
                   <div className={`board-kanban-card ${activeOverlayTask?.isComplete ? "completed" : ""}`} style={{ cursor: 'grabbing' }}>
                   <div className="board-kanban-card-header">
                     <span className={`board-priority-tag ${activeOverlayTask?.priority?.toLowerCase() || "medium"}`}>
                       {activeOverlayTask?.priority || "Medium"}
                     </span>
                     <button className="board-card-action-btn delete" title="Delete">&times;</button>
                   </div>
                   <h4 className="board-kanban-card-title">{activeOverlayTask?.name}</h4>
                   <div className="board-kanban-card-footer">
                     <div className="board-card-due-date">
                       <ClockIcon className="icon-xs" />
                       <span>{activeOverlayTask?.dueDate ? new Date(activeOverlayTask.dueDate).toLocaleDateString() : "No date"}</span>
                     </div>
                     <button className={activeOverlayTask?.isComplete ? "board-card-mark-undone-btn" : "board-card-mark-done-btn"}>
                        {activeOverlayTask?.isComplete ? "Undo" : <><CheckCircleIcon className="icon-sm" /> Done</>}
                     </button>
                   </div>
                 </div>
                ) : null}
              </DragOverlay>
            </div>
          </DndContext>
        )}

        {pendingDelete && (
            <div className="modal-overlay" onClick={() => setPendingDeleteId(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3 className="modal-title">Delete Task?</h3>
                <p>Are you sure you want to delete "{pendingDelete.name}"?</p>
                <div className="modal-actions">
                <button
                    className="action-button"
                    onClick={() => setPendingDeleteId(null)}
                >
                    Cancel
                </button>
                <button
                    className="action-button delete"
                    onClick={() => {
                    onDelete(pendingDelete.id);
                    setPendingDeleteId(null);
                    }}
                >
                    Delete
                </button>
                </div>
            </div>
            </div>
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
