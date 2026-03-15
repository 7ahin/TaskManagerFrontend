import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import toast from "react-hot-toast";
import BoardView from "./components/BoardView.jsx";
import DashboardView from "./components/DashboardView.jsx";
import CalendarView from "./components/CalendarView.jsx";
import LandingView from "./components/LandingView.jsx";
import TimelineView from "./components/TimelineView.jsx";
import GoalsView from "./components/GoalsView.jsx";
import TutorialOverlay from "./components/TutorialOverlay.jsx";
import BackgroundMusic from "./components/BackgroundMusic.jsx";
import ChatAssistant from "./components/ChatAssistant.jsx";
import logoImg from "./assets/logo.png";
import {
  Cog6ToothIcon,
  GlobeAltIcon,
  UserCircleIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import ReactCountryFlag from "react-country-flag";
import { useTranslation } from 'react-i18next';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import LoginModal from './components/LoginModal';
import './i18n';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";


const LANGUAGES = [
  { code: 'en', label: 'English', countryCode: 'US' },
  { code: 'ja', label: '日本語', countryCode: 'JP' },
  { code: 'es', label: 'Español', countryCode: 'ES' },
  { code: 'fr', label: 'Français', countryCode: 'FR' },
  { code: 'de', label: 'Deutsch', countryCode: 'DE' },
  { code: 'ms', label: 'Bahasa Melayu', countryCode: 'MY' },
];

const API_BASE_URL = "https://localhost:7076/api/TodoItems";
const API_AUTH_URL = "https://localhost:7076/api/Auth/google";

function App() {
  const { t, i18n } = useTranslation();
  const [todos, setTodos] = useState([]);
  const [newTodoName, setNewTodoName] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [search, setSearch] = useState("");
  const [boardQuickFilter, setBoardQuickFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState(() => {
    return localStorage.getItem("taskSenpai.activeView") || "landing";
  });
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("taskSenpai.user");
    return saved ? JSON.parse(saved) : null;
  });
  const isLoggedIn = !!user;

  // Helper to generate headers with User ID
  const generateAuthHeaders = useCallback(() => {
    const headers = {
      "Content-Type": "application/json",
    };
    if (user && user.id) {
      headers["X-User-Id"] = user.id.toString();
    }
    return headers;
  }, [user]);

  const todoMetaStorageKey = useMemo(() => {
    if (!user?.id) return null;
    return `taskSenpai.todoMeta.${user.id}`;
  }, [user?.id]);

  const readTodoMeta = useCallback(() => {
    if (!todoMetaStorageKey) return {};
    try {
      const raw = localStorage.getItem(todoMetaStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }, [todoMetaStorageKey]);

  const writeTodoMeta = useCallback(
    (meta) => {
      if (!todoMetaStorageKey) return;
      localStorage.setItem(todoMetaStorageKey, JSON.stringify(meta || {}));
    },
    [todoMetaStorageKey]
  );

  const upsertTodoMeta = useCallback(
    (todoId, patch) => {
      if (!todoMetaStorageKey || todoId == null || !patch) return;
      const key = String(todoId);
      const meta = readTodoMeta();
      meta[key] = { ...(meta[key] || {}), ...patch };
      writeTodoMeta(meta);
    },
    [readTodoMeta, todoMetaStorageKey, writeTodoMeta]
  );

  const removeTodoMeta = useCallback(
    (todoId) => {
      if (!todoMetaStorageKey || todoId == null) return;
      const key = String(todoId);
      const meta = readTodoMeta();
      if (!(key in meta)) return;
      delete meta[key];
      writeTodoMeta(meta);
    },
    [readTodoMeta, todoMetaStorageKey, writeTodoMeta]
  );

  const normalizeTodo = useCallback((todo) => {
    const isComplete = !!todo?.isComplete;
    const status = todo?.status ?? (isComplete ? "Done" : "Working on it");
    return { ...todo, isComplete, status };
  }, []);

  const mergeTodoMeta = useCallback(
    (items) => {
      const meta = readTodoMeta();
      return (items || []).map((todo) => {
        const m = meta[String(todo?.id)] || null;
        const merged = m ? { ...m, ...todo } : todo;
        return normalizeTodo(merged);
      });
    },
    [normalizeTodo, readTodoMeta]
  );

  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalTitle, setLoginModalTitle] = useState("");
  const [loginModalMessage, setLoginModalMessage] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLanguagePopup, setShowLanguagePopup] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("taskSenpai.language") || "en";
  });
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("taskSenpai.settings");
    return saved ? JSON.parse(saved) : {
      theme: 'dark',
      sound: true,
      notifications: true,
      compactMode: false
    };
  });

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setLanguage(langCode);
    localStorage.setItem("taskSenpai.language", langCode);
    setShowLanguagePopup(false);
    toast.success(`Language changed to ${LANGUAGES.find(l => l.code === langCode).label}`);
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem("taskSenpai.settings", JSON.stringify(newSettings));
    
    // Apply side effects
    if (key === 'theme') {
      // Future implementation for theme switching
      document.body.classList.toggle('light-mode', value === 'light');
    }
  };

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const googleIdToken = credentialResponse?.credential;
      if (!googleIdToken) {
        throw new Error("Missing Google credential");
      }

      const decoded = jwtDecode(googleIdToken);

      const authResponse = await fetch(API_AUTH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(googleIdToken),
      });

      const authText = await authResponse.text();
      let authPayload = null;
      try {
        authPayload = authText ? JSON.parse(authText) : null;
      } catch {
        authPayload = null;
      }

      if (!authResponse.ok) {
        const message =
          authPayload?.message ||
          authPayload?.error ||
          authText ||
          "Login failed";
        throw new Error(message);
      }

      const backendUserId = authPayload?.userId ?? authPayload?.id ?? authPayload?.user?.id;
      if (!backendUserId) {
        throw new Error("Login succeeded but backend did not return a user id");
      }

      const userWithBackendId = { ...decoded, id: backendUserId };
      setUser(userWithBackendId);
      localStorage.setItem("taskSenpai.user", JSON.stringify(userWithBackendId));
      setShowLoginModal(false);
      setShowProfilePopup(false);
      
      // Navigate to dashboard if currently on landing
      if (activeView === "landing") {
        setActiveView("dashboard");
      }
      
      toast.success(t('app.profile.login_success', 'Logged in successfully'));
    } catch (error) {
      console.error("Login Failed:", error);
      toast.error(t('app.profile.login_error', 'Login failed'));
    }
  };

  const handleLoginError = () => {
    console.error('Login Failed');
    toast.error(t('app.profile.login_error', 'Login failed'));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("taskSenpai.user");
    setShowProfilePopup(false);
    setActiveView("landing"); // Return to landing view on logout
    toast.success(t('app.profile.logout_success', 'Logged out successfully'));
  };

  const loadTodos = useCallback(async () => {
    // If not logged in, don't try to load tasks (or load empty/local demo tasks if you prefer)
    // For now, we'll just require login for backend tasks
    if (!user) {
        setTodos([]);
        return;
    }

    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(API_BASE_URL, {
        headers: generateAuthHeaders()
      });

      if (!response.ok) {
        throw new Error("Failed to load todos");
      }
      const data = await response.json();
      setTodos(mergeTodoMeta(data));
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [generateAuthHeaders, mergeTodoMeta, user]);

  async function handleAddTodo(event) {
    event.preventDefault();
    
    if (!user) {
      setLoginModalTitle(t('app.auth_required_title', 'Sign In Required'));
      setLoginModalMessage(t('app.auth_required_desc', 'You need to be signed in to add new tasks and sync them across devices.'));
      setShowLoginModal(true);
      return;
    }

    if (!newTodoName.trim()) {
      return;
    }

    try {
      setError("");
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: generateAuthHeaders(),
        body: JSON.stringify({
          name: newTodoName,
          isComplete: false,
          priority: newPriority,
          dueDate: newDueDate || null,
          startDate: newStartDate || null,
          status: "Working on it",
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Unauthorized: Please sign in");
        }
        throw new Error("Failed to create todo");
      }

      const responseText = await response.text();
      let createdTodo = null;
      try {
        createdTodo = responseText ? JSON.parse(responseText) : null;
      } catch {
        createdTodo = null;
      }

      const createdId = createdTodo?.id ?? createdTodo?.Id ?? null;
      const metaPatch = {
        priority: newPriority,
        dueDate: newDueDate || null,
        startDate: newStartDate || null,
        status: "Working on it",
      };
      if (createdId != null) {
        upsertTodoMeta(createdId, metaPatch);
        setTodos((prev) => {
          const existing = (prev || []).some((t) => t.id === createdId);
          if (existing) return prev;
          return [...(prev || []), normalizeTodo({ ...metaPatch, ...createdTodo, id: createdId })];
        });
      } else {
        await loadTodos();
      }

      setNewTodoName("");
      toast.success("Task added");
    } catch (err) {
      setError(err.message || "Unknown error");
      toast.error(err.message || "Failed to add task");
    }
  }

  async function handleUpdateTodo(updatedTodo) {
    try {
      setError("");
      const response = await fetch(`${API_BASE_URL}/${updatedTodo.id}`, {
        method: "PUT",
        headers: generateAuthHeaders(),
        body: JSON.stringify(updatedTodo),
      });

      if (!response.ok) {
        throw new Error("Failed to update todo");
      }

      if (updatedTodo?.id != null) {
        const patch = {};
        if (updatedTodo.status != null) patch.status = updatedTodo.status;
        if (updatedTodo.priority != null) patch.priority = updatedTodo.priority;
        if (updatedTodo.dueDate !== undefined) patch.dueDate = updatedTodo.dueDate;
        if (updatedTodo.startDate !== undefined) patch.startDate = updatedTodo.startDate;
        if (Object.keys(patch).length > 0) upsertTodoMeta(updatedTodo.id, patch);
      }

      setTodos((prev) =>
        (prev || []).map((t) =>
          t.id === updatedTodo.id ? normalizeTodo({ ...t, ...updatedTodo }) : t
        )
      );
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
    if (!todo.isComplete) {
      updated.status = "Done";
    } else if (todo.status === "Done") {
      updated.status = "Working on it";
    }
    await handleUpdateTodo(updated);
  }

  async function handleDelete(todo) {
    try {
      setError("");
      const response = await fetch(`${API_BASE_URL}/${todo.id}`, {
        method: "DELETE",
        headers: generateAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to delete todo");
      }

      removeTodoMeta(todo.id);
      setTodos((prev) => (prev || []).filter((t) => t.id !== todo.id));
    } catch (err) {
      setError(err.message || "Unknown error");
      toast.error("Failed to delete");
    }
  }

  const filteredTodos = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const dayStartMs = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const isPending = (t) => !t?.isComplete;

    const quickFiltered = (todos || []).filter((t) => {
      if (boardQuickFilter === "all") return true;
      if (boardQuickFilter === "pending") return isPending(t);
      if (boardQuickFilter === "completed") return !!t?.isComplete;
      if (boardQuickFilter === "high_priority") {
        return isPending(t) && String(t?.priority || "Medium").toLowerCase() === "high";
      }
      if (!isPending(t)) return false;

      if (boardQuickFilter === "no_due") return !t?.dueDate;
      if (!t?.dueDate) return false;

      const due = new Date(t.dueDate);
      const dueStart = dayStartMs(due);

      if (boardQuickFilter === "overdue") return dueStart < todayStart;
      if (boardQuickFilter === "due_today") return dueStart === todayStart;
      if (boardQuickFilter === "due_week") {
        const diffDays = (dueStart - todayStart) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays < 7;
      }
      return true;
    });

    const term = search.trim().toLowerCase();
    if (!term) return quickFiltered;
    return quickFiltered.filter((t) => t.name?.toLowerCase().includes(term));
  }, [todos, search, boardQuickFilter]);

  useEffect(() => {
    localStorage.setItem("taskSenpai.activeView", activeView);
  }, [activeView]);

  useEffect(() => {
    // Only load todos if we have a user
    if (user) {
        loadTodos();
    } else {
        setTodos([]);
    }
    
    // Initialize settings
    if (settings.theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [loadTodos, settings.theme, user]); // Re-run when user changes

  // Force landing view if not authenticated
  useEffect(() => {
    if (!user && activeView !== "landing") {
      setActiveView("landing");
    }
  }, [user, activeView]);

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

  const handleNavigation = (view) => {
    if (!user && view !== 'landing') {
      setLoginModalTitle(t('app.auth_required_title', 'Sign In Required'));
      setLoginModalMessage(t('app.auth_required_desc', 'You need to be signed in to access this feature.'));
      setShowLoginModal(true);
      return;
    }
    setActiveView(view);
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <div className="app-root">
      {showLoginModal && (
        <LoginModal 
          onClose={() => {
            setShowLoginModal(false);
            setLoginModalTitle("");
            setLoginModalMessage("");
          }}
          onLoginSuccess={handleLoginSuccess}
          onLoginError={handleLoginError}
          customTitle={loginModalTitle}
          customMessage={loginModalMessage}
        />
      )}

      <BackgroundMusic />
      <ChatAssistant 
        user={user} 
        todos={todos} 
        onNavigate={handleNavigation} 
      />
      <header className={`app-header landing-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="app-header-left">
          <button 
            className="logo-button" 
            onClick={() => handleNavigation('landing')}
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
              onClick={() => handleNavigation("dashboard")}
            >
              {t('app.nav.dashboard')}
            </button>
            <button
              className={"app-nav-tab" + (activeView == "board" ? " active" : "")}
              onClick={() => handleNavigation("board")}
            >
              {t('app.nav.board')}
            </button>
            <button
              className={"app-nav-tab" + (activeView == "timeline" ? " active" : "")}
              onClick={() => handleNavigation("timeline")}
            >
              {t('app.nav.timeline')}
            </button>
            <button
              className={"app-nav-tab" + (activeView == "calendar" ? " active" : "")}
              onClick={() => handleNavigation("calendar")}
            >
              {t('app.nav.calendar')}
            </button>
            <button
              className={"app-nav-tab" + (activeView == "goals" ? " active" : "")}
              onClick={() => handleNavigation("goals")}
            >
              {t('app.nav.goals')}
            </button>
          </div>
        </nav>

        <div className="app-header-right">
          <div className="language-container" style={{ position: 'relative' }}>
            <button 
              className={`icon-button ${showLanguagePopup ? 'active' : ''}`}
              title={t('app.header.language')}
              onClick={() => {
                setShowLanguagePopup(!showLanguagePopup);
                setShowSettingsPopup(false);
                setShowProfilePopup(false);
              }}
            >
              <GlobeAltIcon className="icon-svg" />
            </button>
            {showLanguagePopup && (
              <div className="language-popup">
                <div className="popup-title">{t('app.languages.title')}</div>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    className={`language-option ${language === lang.code ? 'active' : ''}`}
                    onClick={() => handleLanguageChange(lang.code)}
                  >
                    <ReactCountryFlag countryCode={lang.countryCode} svg style={{ width: '1.5em', height: '1.5em' }} />
                    <span className="lang-label">{lang.label}</span>
                    {language === lang.code && <CheckIcon className="icon-xs" style={{ marginLeft: 'auto', width: '16px', height: '16px' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="settings-container" style={{ position: 'relative' }}>
            <button 
              className={`icon-button ${showSettingsPopup ? 'active' : ''}`}
              title={t('app.header.settings')}
              onClick={() => {
                setShowSettingsPopup(!showSettingsPopup);
                setShowLanguagePopup(false);
                setShowProfilePopup(false);
              }}
            >
              <Cog6ToothIcon className="icon-svg" />
            </button>
            {showSettingsPopup && (
            <div className="settings-popup">
              <div className="popup-title">{t('app.settings.title')}</div>
              
              <div className="setting-item">
                <span>{t('app.settings.theme')}</span>
                <div className="toggle-group">
                  <button 
                    className={`toggle-btn ${settings.theme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleSettingChange('theme', 'dark')}
                  >
                    {t('app.settings.theme_dark')}
                  </button>
                  <button 
                    className={`toggle-btn ${settings.theme === 'light' ? 'active' : ''}`}
                    onClick={() => handleSettingChange('theme', 'light')}
                  >
                    {t('app.settings.theme_light')}
                  </button>
                </div>
              </div>

              <div className="setting-item">
                <span>{t('app.settings.sound')}</span>
                <button 
                  className={`toggle-switch ${settings.sound ? 'active' : ''}`}
                  onClick={() => handleSettingChange('sound', !settings.sound)}
                >
                  <div className="toggle-knob"></div>
                </button>
              </div>

              <div className="setting-item">
                <span>{t('app.settings.notifications')}</span>
                <button 
                  className={`toggle-switch ${settings.notifications ? 'active' : ''}`}
                  onClick={() => handleSettingChange('notifications', !settings.notifications)}
                >
                  <div className="toggle-knob"></div>
                </button>
              </div>

              <div className="setting-item">
                <span>{t('app.settings.compact_mode')}</span>
                <button 
                  className={`toggle-switch ${settings.compactMode ? 'active' : ''}`}
                  onClick={() => handleSettingChange('compactMode', !settings.compactMode)}
                >
                  <div className="toggle-knob"></div>
                </button>
              </div>
            </div>
          )}
          </div>
          <div className="profile-container" style={{ position: 'relative' }}>
            <button
              className={`icon-button ${showProfilePopup ? 'active' : ''}`}
              onClick={() => {
                setShowProfilePopup(!showProfilePopup);
                setShowLanguagePopup(false);
                setShowSettingsPopup(false);
              }}
              title={t('app.header.profile')}
            >
              {isLoggedIn && user?.picture ? (
                <img 
                  src={user.picture} 
                  alt="Profile" 
                  className="profile-avatar" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserCircleIcon className="icon-svg" />
              )}
            </button>
            {showProfilePopup && (
              <div className="profile-popup">
                <div className="popup-title">
                  {isLoggedIn ? (user?.name || t('app.profile.title_user')) : t('app.profile.title_guest')}
                </div>
                <div className="profile-popup-text">
                  {isLoggedIn
                    ? (user?.email || t('app.profile.desc_user'))
                    : t('app.profile.desc_guest')}
                </div>
                <div className="profile-popup-actions">
                  <button
                    className="profile-popup-button"
                    onClick={() => setShowProfilePopup(false)}
                  >
                    {t('app.profile.close')}
                  </button>
                  <button
                    className={`profile-popup-button ${isLoggedIn ? 'danger' : 'primary'}`}
                    onClick={() => {
                      if (isLoggedIn) {
                        handleLogout();
                      } else {
                        setShowLoginModal(true);
                        setShowProfilePopup(false);
                      }
                    }}
                  >
                    {isLoggedIn ? t('app.profile.logout') : t('app.profile.login')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-container">
        {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}

        <div key={activeView} className="app-view-transition">
          {activeView == "landing" && (
            <LandingView
              onGetStarted={() => handleNavigation('dashboard')}
              onStartTutorial={() => setShowTutorial(true)}
            />
          )}

          {activeView == "dashboard" && (
            <DashboardView
              todos={todos}
              onGoBoard={(filterKey) => {
                if (filterKey) {
                  setSearch("");
                  setBoardQuickFilter(filterKey);
                }
                handleNavigation("board");
              }}
              onOpenTask={(t) => {
                setBoardQuickFilter("all");
                setSearch(t?.name || "");
                handleNavigation("board");
              }}
              onToggleComplete={handleToggleComplete}
            />
          )}

          {activeView == "board" && (
            <BoardView
              todos={todos}
              filteredTodos={filteredTodos}
              search={search}
              setSearch={setSearch}
              boardQuickFilter={boardQuickFilter}
              setBoardQuickFilter={setBoardQuickFilter}
              newTodoName={newTodoName}
              setNewTodoName={setNewTodoName}
              newPriority={newPriority}
              setNewPriority={setNewPriority}
              newDueDate={newDueDate}
              setNewDueDate={setNewDueDate}
              newStartDate={newStartDate}
              setNewStartDate={setNewStartDate}
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
            <GoalsView
              todos={todos}
              onGoBoard={(filterKey) => {
                if (filterKey) {
                  setSearch("");
                  setBoardQuickFilter(filterKey);
                }
                handleNavigation("board");
              }}
            />
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
        </div>
      </main>
    </div>
    </GoogleOAuthProvider>
  );
}

export default App;
