import { useEffect, useState } from "react";

const API_BASE_URL = "https://localhost:7076/api/TodoItems";

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodoName, setNewTodoName] = useState("");
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

  useEffect(() => {
    loadTodos();
  }, []);

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Task Manager</h1>

      <form onSubmit={handleAddTodo} style={{ marginBottom: "1rem" }}>
        <input
            type="text"
            value={newTodoName}
            onChange={(e) => setNewTodoName(e.target.value)}
            placeholder="New task name"
            style={{ padding: "0.5rem", width: "70%", marginRight: "0.55rem" }}
          />
        <button type="submit" style={{ padding: "0.5rem 1rem" }}>Add</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {todos.length === 0 && !loading ? (
        <p>No tasks yet.</p>
      ) : (
        <ul>
          {todos.map((todo) => (
            <li key={todo.id}>
              <span style={{ textDecoration: todo.isComplete ? "line-through" : "none" }}> {todo.name} </span>{" "}
              {todo.isComplete && <span>(done)</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;

