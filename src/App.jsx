import "./App.css";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "https://localhost:7076/api/TodoItems";

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodoName, setNewTodoName] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadTodos() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error("Failed to load todos");
      }
      const data = await response.json();
      setTodos(data);
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTodo(event) {
    event.preventDefault();
    if (!newTodoName.trim()) {
      return;
    }

    try {
      setError("");
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTodoName,
          isComplete: false,
          priority: newPriority,
          dueDate: newDueDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create todo");
      }

      setNewTodoName("");
      await loadTodos();
    } catch (err) {
      setError(err.message || "Unknown error");
    }
  }

  async function handleToggleComplete(todo) {
    try {
      setError("");
      const updated = {
        id: todo.id,
        name: todo.name,
        isComplete: !todo.isComplete,
      };

      const response = await fetch(`${API_BASE_URL}/${todo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updated),
      });

      if (!response.ok) {
        throw new Error("Failed to update todo");
      }

      await loadTodos();
    } catch (err) {
      setError(err.message || "Unknown error");
    }
  }

  async function handleDelete(todo) {
    try {
      setError("");
      const response = await fetch(`${API_BASE_URL}/${todo.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete todo");
      }

      await loadTodos();
    } catch (err) {
      setError(err.message || "Unknown error");
    }
  }

  const filteredTodos = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return todos;
    }
    return todos.filter((t) => t.name?.toLowerCase().includes(term));
  }, [todos, search]);

  useEffect(() => {
    loadTodos();
  }, []);

  return (
    <div className="app-root">
      <header className="app-header">
        <div>
          <div className="app-header-title">Task Board</div>
          <div className="app-header-subtitle">Simple high-level overview of your tasks</div>                  
        </div>
        <div className="app-header-right">
          <span>My Workspace</span>
          <div className="avatar-circle">U</div>
        </div>
      </header>

      <main className="app-container">
        <section className="board-card">
          <div className="board-header">
            <div>
                <div className="board-title">High Level Overview</div>
                <div className="board-subtitle">Inspired by Monday-style boards: items, status, quick actions</div>
            </div>
            <input 
              className="search-input"
              type="search"
              placeholder="Search tasks"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <form className="add-row" onSubmit={handleAddTodo}>
            <input
              className="add-input"
              type="text"
              value={newTodoName}
              onChange={(e) => setNewTodoName(e.target.value)}
              placeholder="Add a new task"
            />
            <select
              className="add-input"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <input
              className="add-input"
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
            <button className="add-button" type="submit"> + Add Task </button>
          </form>
          {error && <div className="error-text">{error}</div>}

          <div className="board-table-wrapper">
            <table className="board-table">
              <thead>
                <tr>
                  <th className="checkbox-cell"></th>
                  <th>Item</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th className="actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTodos.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={4}
                    className="empty-state">
                      No tasks to show. Add one above to get started.
                    </td>
                  </tr>
                ) : (
                  filteredTodos.map((todo) => (
                    <tr key={todo.id}>
                      <td className="checkbox-cell">
                        <input 
                          className="checkbox-input"
                          type="checkbox"
                          checked={todo.isComplete}
                          onChange={() => handleToggleComplete(todo)}
                        />
                      </td>
                      <td>
                        <span className={ "item-name" + (todo.isComplete ? "completed" : "") }>
                          {todo.name}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill priority-${(todo.priority || "Medium").toLowerCase()}`}>
                          {todo.priority || "Medium"}
                        </span>
                      </td>
                      <td>
                        {todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : "—"}
                      </td>
                      <td>
                        <span className={"status-pill " + (todo.isComplete ? "done" : "working")}>
                          {todo.isComplete ? "Done" : "Working on it"}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          className="action-button delete"
                          onClick={() => handleDelete(todo)}>Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="meta-bar">
            <span>
              Total tasks: {todos.length} • Showing: {filteredTodos.length}
            </span>
            {loading && <span>Syncing with server...</span>}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;