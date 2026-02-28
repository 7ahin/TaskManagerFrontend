import { useEffect, useMemo, useState } from "react";
import "./App.css";
import toast from "react-hot-toast";
import BoardView from "./components/BoardView.jsx";
import DashboardView from "./components/DashboardView.jsx";
import CalendarView from "./components/CalendarView.jsx";
import LandingView from "./components/LandingView.jsx";
import TimelineView from "./components/TimelineView.jsx";
import GoalsView from "./components/GoalsView.jsx";
import logoImg from "./assets/logo.png";
import {
  Cog6ToothIcon,
  GlobeAltIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL = "https://localhost:7076/api/TodoItems";

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodoName, setNewTodoName] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("landing");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
      toast.success("Task added");
    } catch (err) {
      setError(err.message || "Unknown error");
    }
  }

  async function handleUpdateTodo(updatedTodo) {
    try {
      setError("");
      const response = await fetch(`${API_BASE_URL}/${updatedTodo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTodo),
      });

      if (!response.ok) {
        throw new Error("Failed to update todo");
      }

      await loadTodos();
      toast.success("Task updated");
    } catch (err) {
      setError(err.message || "Unknown error");
    }
  }

  async function handleToggleComplete(todo) {
    const updated = {
      ...todo,
      isComplete: !todo.isComplete,
    };
    await handleUpdateTodo(updated);
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
      toast.error("Failed to delete");
    }
  }

  const filteredTodos = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return todos;
    return todos.filter((t) => t.name?.toLowerCase().includes(term));
  }, [todos, search]);

  useEffect(() => {
    loadTodos();
  }, []);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="app-root">
      <header className={`app-header landing-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="app-header-left">
          <button 
            className="logo-button" 
            onClick={() => setActiveView('landing')}
            style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <div className="logo-group">
              <img src={logoImg} alt="Task Senpai logo" className="logo-nav-img" />
            </div>
          </button>
        </div>

        <nav className="app-header-center">
          <div className="app-nav-tabs">
            <button
              className={
                "app-nav-tab" + (activeView == "dashboard" ? " active" : "")
              }
              onClick={() => setActiveView("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={"app-nav-tab" + (activeView == "board" ? " active" : "")}
              onClick={() => setActiveView("board")}
            >
              Board
            </button>
            <button
              className={"app-nav-tab" + (activeView == "timeline" ? " active" : "")}
              onClick={() => setActiveView("timeline")}
            >
              Timeline
            </button>
            <button
              className={"app-nav-tab" + (activeView == "calendar" ? " active" : "")}
              onClick={() => setActiveView("calendar")}
            >
              Calendar
            </button>
            <button
              className={"app-nav-tab" + (activeView == "goals" ? " active" : "")}
              onClick={() => setActiveView("goals")}
            >
              Goals
            </button>
          </div>
        </nav>

        <div className="app-header-right">
          <button className="icon-button" title="Language">
            <GlobeAltIcon className="icon-svg" />
          </button>
          <button className="icon-button" title="Settings">
            <Cog6ToothIcon className="icon-svg" />
          </button>
          <div className="profile-container">
            <button
              className="icon-button"
              onClick={() => setShowProfilePopup((v) => !v)}
              title="Profile"
            >
              <UserCircleIcon className="icon-svg" />
            </button>
            {showProfilePopup && (
              <div className="profile-popup">
                <div className="profile-popup-title">
                  {isLoggedIn ? "Profile" : "Welcome to Task Senpai"}
                </div>
                <div className="profile-popup-text">
                  {isLoggedIn
                    ? "You are logged in as Demo User."
                    : "You are currently browsing as a guest."}
                </div>
                <div className="profile-popup-actions">
                  <button
                    className="profile-popup-button"
                    onClick={() => setShowProfilePopup(false)}
                  >
                    Close
                  </button>
                  <button
                    className="profile-popup-button primary"
                    onClick={() => {
                      setIsLoggedIn((v) => !v);
                    }}
                  >
                    {isLoggedIn ? "Log out" : "Log in"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-container">
        {activeView == "landing" && (
          <LandingView onGetStarted={() => setActiveView("dashboard")} />
        )}

        {activeView == "dashboard" && (
          <DashboardView
            todos={todos}
            onGoBoard={() => setActiveView("board")}
          />
        )}

        {activeView == "board" && (
          <BoardView
            todos={todos}
            filteredTodos={filteredTodos}
            search={search}
            setSearch={setSearch}
            newTodoName={newTodoName}
            setNewTodoName={setNewTodoName}
            newPriority={newPriority}
            setNewPriority={setNewPriority}
            newDueDate={newDueDate}
            setNewDueDate={setNewDueDate}
            loading={loading}
            error={error}
            onAddTodo={handleAddTodo}
            onUpdateTodo={handleUpdateTodo}
            onToggleComplete={handleToggleComplete}
            onDelete={handleDelete}
          />
        )}

        {activeView === "calendar" && (
          <CalendarView
            todos={todos}
            onToggleComplete={handleToggleComplete}
            onGoBoard={() => setActiveView("board")}
          />
        )}

        {activeView === "goals" && (
          <GoalsView todos={todos} onGoBoard={() => setActiveView("board")} />
        )}

        {activeView === "timeline" && (
          <TimelineView
            todos={todos}
            onToggleComplete={handleToggleComplete}
            onUpdateTask={handleUpdateTodo}
            onGoBoard={() => setActiveView("board")}
            onOpenTask={(t) => {
              setSearch(t.name || "");
              setActiveView("board");
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;
