import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  BellIcon,
} from "@heroicons/react/24/outline";
import ReactCountryFlag from "react-country-flag";
import { useTranslation } from 'react-i18next';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import LoginModal from './components/LoginModal';
import './i18n';
import { apiDelete, apiGet, apiPost, apiPut } from "./utils/apiClient.js";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";


const LANGUAGES = [
  { code: 'en', label: 'English', countryCode: 'US' },
  { code: 'ja', label: '日本語', countryCode: 'JP' },
  { code: 'es', label: 'Español', countryCode: 'ES' },
  { code: 'fr', label: 'Français', countryCode: 'FR' },
  { code: 'de', label: 'Deutsch', countryCode: 'DE' },
  { code: 'ms', label: 'Bahasa Melayu', countryCode: 'MY' },
];

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
    let rememberLastView = true;
    let startView = "dashboard";
    try {
      const rawSettings = localStorage.getItem("taskSenpai.settings");
      const parsed = rawSettings ? JSON.parse(rawSettings) : null;
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.rememberLastView === "boolean") rememberLastView = parsed.rememberLastView;
        if (typeof parsed.startView === "string" && parsed.startView) startView = parsed.startView;
      }
    } catch {
      void 0;
    }
    if (!rememberLastView) return startView;
    return localStorage.getItem("taskSenpai.activeView") || startView;
  });
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("taskSenpai.user");
    return saved ? JSON.parse(saved) : null;
  });
  const isLoggedIn = !!user;
  const lastDeletedTodoRef = useRef(null);
  const todosRef = useRef([]);
  const notificationStateRef = useRef({ overdueIds: new Set(), dueTodayIds: new Set() });
  const notificationAudioCtxRef = useRef(null);

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
        const backendCreated =
          merged?.createdAt ??
          merged?.CreatedAt ??
          merged?.created_at ??
          merged?.createdDate ??
          merged?.created_on ??
          merged?.CreatedOn ??
          null;
        const metaCreated = m?.createdAt ?? m?.created_at ?? m?.CreatedAt ?? null;
        const createdAt = backendCreated ?? metaCreated ?? null;
        return normalizeTodo(createdAt ? { ...merged, createdAt } : merged);
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
  const [showNotificationsPopup, setShowNotificationsPopup] = useState(false);
  const languageContainerRef = useRef(null);
  const settingsContainerRef = useRef(null);
  const notificationsContainerRef = useRef(null);
  const profileContainerRef = useRef(null);
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("taskSenpai.language") || "en";
  });
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("taskSenpai.settings");
    const defaults = {
      theme: "dark",
      sound: true,
      rememberLastView: true,
      startView: "dashboard",
      notifications: {
        enabled: true,
        inApp: true,
        desktop: false,
        dueToday: true,
        overdue: true,
      },
    };
    if (!saved) return defaults;
    try {
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== "object") return defaults;
      const next = { ...defaults, ...parsed };
      const savedNotifications = parsed.notifications;
      if (typeof savedNotifications === "boolean") {
        next.notifications = { ...defaults.notifications, enabled: savedNotifications };
      } else if (savedNotifications && typeof savedNotifications === "object") {
        next.notifications = { ...defaults.notifications, ...savedNotifications };
      } else {
        next.notifications = defaults.notifications;
      }
      return next;
    } catch {
      return defaults;
    }
  });

  const notificationLogStorageKey = useMemo(() => {
    const id = user?.id != null ? String(user.id) : "guest";
    return `taskSenpai.notifications.log.${id}`;
  }, [user?.id]);

  const notificationUnreadStorageKey = useMemo(() => {
    const id = user?.id != null ? String(user.id) : "guest";
    return `taskSenpai.notifications.unread.${id}`;
  }, [user?.id]);

  const [notificationLog, setNotificationLog] = useState([]);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setLanguage(langCode);
    localStorage.setItem("taskSenpai.language", langCode);
    setShowLanguagePopup(false);
    const languageLabel =
      t(`app.languages.${langCode}`, LANGUAGES.find((l) => l.code === langCode)?.label || langCode);
    toast.success(t("app.languages.changed", { language: languageLabel }));
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
    if (key === "rememberLastView") {
      if (value) {
        localStorage.setItem("taskSenpai.activeView", activeView);
      } else {
        localStorage.removeItem("taskSenpai.activeView");
        setActiveView(newSettings.startView || "dashboard");
      }
    }
    if (key === "startView" && newSettings.rememberLastView === false) {
      setActiveView(value || "dashboard");
    }
  };

  const updateNotificationSettings = (patch) => {
    const current = settings?.notifications || {};
    const nextNotifications = { ...current, ...(patch || {}) };
    const nextSettings = { ...settings, notifications: nextNotifications };
    setSettings(nextSettings);
    localStorage.setItem("taskSenpai.settings", JSON.stringify(nextSettings));

    const shouldRequest =
      (patch?.desktop === true || patch?.enabled === true) && nextNotifications.desktop === true;
    if (shouldRequest && typeof Notification !== "undefined" && Notification?.permission === "default") {
      Notification.requestPermission().catch(() => undefined);
    }
  };

  useEffect(() => {
    const anyOpen = showLanguagePopup || showSettingsPopup || showNotificationsPopup || showProfilePopup;
    if (!anyOpen) return;

    const onPointerDown = (e) => {
      const target = e.target;
      if (languageContainerRef.current && languageContainerRef.current.contains(target)) return;
      if (settingsContainerRef.current && settingsContainerRef.current.contains(target)) return;
      if (notificationsContainerRef.current && notificationsContainerRef.current.contains(target)) return;
      if (profileContainerRef.current && profileContainerRef.current.contains(target)) return;

      setShowLanguagePopup(false);
      setShowSettingsPopup(false);
      setShowNotificationsPopup(false);
      setShowProfilePopup(false);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowLanguagePopup(false);
        setShowSettingsPopup(false);
        setShowNotificationsPopup(false);
        setShowProfilePopup(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showLanguagePopup, showSettingsPopup, showNotificationsPopup, showProfilePopup]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(notificationLogStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setNotificationLog(Array.isArray(parsed) ? parsed : []);
    } catch {
      setNotificationLog([]);
    }
  }, [notificationLogStorageKey]);

  useEffect(() => {
    const raw = localStorage.getItem(notificationUnreadStorageKey);
    const num = raw ? Number(raw) : 0;
    setNotificationUnreadCount(Number.isFinite(num) && num > 0 ? num : 0);
  }, [notificationUnreadStorageKey]);

  const appendNotificationLog = useCallback(
    (entry) => {
      if (!entry) return;
      if (entry.id) {
        try {
          const raw = localStorage.getItem(notificationLogStorageKey);
          const parsed = raw ? JSON.parse(raw) : [];
          if (Array.isArray(parsed) && parsed.some((e) => e?.id === entry.id)) return;
        } catch {
          void 0;
        }
      }
      setNotificationLog((prev) => {
        const next = [entry, ...(prev || [])].slice(0, 50);
        localStorage.setItem(notificationLogStorageKey, JSON.stringify(next));
        return next;
      });

      setNotificationUnreadCount((prev) => {
        const next = Math.min((prev || 0) + 1, 99);
        localStorage.setItem(notificationUnreadStorageKey, String(next));
        return next;
      });
    },
    [notificationLogStorageKey, notificationUnreadStorageKey]
  );

  const clearNotificationLog = useCallback(() => {
    setNotificationLog([]);
    localStorage.setItem(notificationLogStorageKey, JSON.stringify([]));
    setNotificationUnreadCount(0);
    localStorage.setItem(notificationUnreadStorageKey, "0");
  }, [notificationLogStorageKey, notificationUnreadStorageKey]);

  const playNotificationSound = useCallback(() => {
    if (!settings?.sound) return;
    if (typeof window === "undefined") return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    let ctx = notificationAudioCtxRef.current;
    if (!ctx) {
      ctx = new Ctx();
      notificationAudioCtxRef.current = ctx;
    }

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => undefined);
    }

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(660, now + 0.1);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.23);
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (err) {
        void err;
      }
    };
  }, [settings?.sound]);

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const googleIdToken = credentialResponse?.credential;
      if (!googleIdToken) {
        throw new Error("Missing Google credential");
      }

      const decoded = jwtDecode(googleIdToken);
      const authPayload = await apiPost("/Auth/google", googleIdToken);

      const backendUserId = authPayload?.userId ?? authPayload?.id ?? authPayload?.user?.id;
      if (!backendUserId) {
        throw new Error("Login succeeded but backend did not return a user id");
      }

      const userWithBackendId = { ...decoded, id: backendUserId };
      setUser(userWithBackendId);
      localStorage.setItem("taskSenpai.user", JSON.stringify(userWithBackendId));
      setShowLoginModal(false);
      setShowProfilePopup(false);
      
      if (activeView === "landing") {
        if (settings.rememberLastView) {
          const savedView = localStorage.getItem("taskSenpai.activeView");
          setActiveView(savedView || settings.startView || "dashboard");
        } else {
          setActiveView(settings.startView || "dashboard");
        }
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

      const data = await apiGet("/TodoItems", { userId: user.id });
      setTodos(mergeTodoMeta(data));
    } catch (err) {
      setError(err.message || "Unknown error");
      toast.error(t("board.toast.couldNotLoad"));
    } finally {
      setLoading(false);
    }
  }, [mergeTodoMeta, t, user]);

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
      const createdTodo = await apiPost(
        "/TodoItems",
        {
          name: newTodoName,
          isComplete: false,
          priority: newPriority,
          dueDate: newDueDate || null,
          startDate: newStartDate || null,
          status: "Working on it",
        },
        { userId: user.id }
      );

      const createdId = createdTodo?.id ?? createdTodo?.Id ?? null;
      const createdAt =
        createdTodo?.createdAt ??
        createdTodo?.CreatedAt ??
        createdTodo?.created_at ??
        createdTodo?.createdDate ??
        createdTodo?.created_on ??
        createdTodo?.CreatedOn ??
        new Date().toISOString();
      const metaPatch = {
        priority: newPriority,
        dueDate: newDueDate || null,
        startDate: newStartDate || null,
        status: "Working on it",
        createdAt,
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
      toast.success(t("board.toast.added"));
    } catch (err) {
      setError(err.message || "Unknown error");
      toast.error(err.message || t("board.toast.addFailed"));
    }
  }

  async function handleUpdateTodo(updatedTodo) {
    try {
      setError("");
      await apiPut(`/TodoItems/${updatedTodo.id}`, updatedTodo, { userId: user?.id });

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
      toast.success(t("board.toast.updated"));
    } catch (err) {
      setError(err.message || "Unknown error");
      toast.error(err.message || t("board.toast.updateFailed"));
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
      await apiDelete(`/TodoItems/${todo.id}`, { userId: user?.id });

      removeTodoMeta(todo.id);
      setTodos((prev) => (prev || []).filter((t) => t.id !== todo.id));
      lastDeletedTodoRef.current = todo;
      toast((toastInstance) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>{t("board.toast.deleted")}</span>
          <button
            className="action-button"
            onClick={async () => {
              const snapshot = lastDeletedTodoRef.current;
              if (!snapshot) return toast.dismiss(toastInstance.id);
              try {
                const payload = {
                  name: snapshot.name,
                  isComplete: !!snapshot.isComplete,
                  priority: snapshot.priority || "Medium",
                  dueDate: snapshot.dueDate || null,
                  startDate: snapshot.startDate || null,
                  status: snapshot.status || (snapshot.isComplete ? "Done" : "Working on it"),
                };
                const createdTodo = await apiPost("/TodoItems", payload, { userId: user?.id });

                const createdId = createdTodo?.id ?? createdTodo?.Id ?? null;
                const createdAt =
                  createdTodo?.createdAt ??
                  createdTodo?.CreatedAt ??
                  createdTodo?.created_at ??
                  createdTodo?.createdDate ??
                  createdTodo?.created_on ??
                  createdTodo?.CreatedOn ??
                  new Date().toISOString();
                const metaPatch = {
                  priority: payload.priority,
                  dueDate: payload.dueDate,
                  startDate: payload.startDate,
                  status: payload.status,
                  createdAt,
                };

                if (createdId != null) {
                  upsertTodoMeta(createdId, metaPatch);
                  setTodos((prev) => {
                    const existing = (prev || []).some((t) => t.id === createdId);
                    if (existing) return prev;
                    return [normalizeTodo({ ...metaPatch, ...createdTodo, id: createdId }), ...(prev || [])];
                  });
                } else {
                  await loadTodos();
                }

                lastDeletedTodoRef.current = null;
                toast.success(t("board.toast.undoSuccessful"));
              } catch {
                toast.error(t("board.toast.undoFailed"));
              } finally {
                toast.dismiss(toastInstance.id);
              }
            }}
          >
            {t("board.buttons.undo")}
          </button>
        </div>
      ));
    } catch (err) {
      setError(err.message || "Unknown error");
      toast.error(err.message || t("board.toast.deleteFailed"));
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
    if (settings.rememberLastView) {
      localStorage.setItem("taskSenpai.activeView", activeView);
    } else {
      localStorage.removeItem("taskSenpai.activeView");
    }
  }, [activeView, settings.rememberLastView]);

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

  const runNotificationsCheck = useCallback(() => {
    const notifications = settings?.notifications || {};
    if (!notifications.enabled) return;
    if (!user?.id) return;

    const msDay = 1000 * 60 * 60 * 24;
    const dayStartMs = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

    const notify = (entry) => {
      playNotificationSound();
      appendNotificationLog(entry);
      if (notifications.inApp) toast(entry.message);
      if (!notifications.desktop) return;
      if (typeof Notification === "undefined") return;
      if (Notification.permission !== "granted") return;
      try {
        new Notification("Task Senpai", { body: entry.message });
      } catch (err) {
        void err;
      }
    };

    const items = todosRef.current || [];
    const now = new Date();
    const todayStart = dayStartMs(now);
    const tomorrowStart = todayStart + msDay;

    const pendingWithDue = items
      .filter((task) => task && !task.isComplete && task.dueDate)
      .map((task) => {
        const raw = task.dueDate;
        let due;
        if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          const [yy, mm, dd] = raw.split("-").map((p) => Number(p));
          due = new Date(yy, mm - 1, dd);
        } else {
          due = new Date(raw);
        }
        if (Number.isNaN(due.getTime())) return null;
        return { task, dueStart: dayStartMs(due) };
      })
      .filter(Boolean);

    const idKeyOf = (task) => {
      const raw = task?.id ?? task?.Id ?? task?.todoId ?? task?.todo_id ?? null;
      if (raw == null) return null;
      return String(raw);
    };

    const overdue = pendingWithDue
      .filter((x) => x.dueStart < todayStart)
      .map((x) => ({ task: x.task, dueStart: x.dueStart, idKey: idKeyOf(x.task) }))
      .filter((x) => !!x.idKey);

    const dueToday = pendingWithDue
      .filter((x) => x.dueStart >= todayStart && x.dueStart < tomorrowStart)
      .map((x) => ({ task: x.task, dueStart: x.dueStart, idKey: idKeyOf(x.task) }))
      .filter((x) => !!x.idKey);

    const prevOverdueIds = new Set(Array.from(notificationStateRef.current.overdueIds || []).map((v) => String(v)));
    const prevDueTodayIds = new Set(Array.from(notificationStateRef.current.dueTodayIds || []).map((v) => String(v)));

    const newOverdue = overdue.filter((x) => !prevOverdueIds.has(x.idKey));
    const newDueToday = dueToday.filter((x) => !prevDueTodayIds.has(x.idKey));

    const tasksWord = t("dashboard.misc.tasks", "tasks");
    if (notifications.overdue && newOverdue.length > 0) {
      if (newOverdue.length <= 3) {
        for (const x of newOverdue) {
          notify({
            id: `overdue:${x.idKey}:${x.dueStart}`,
            ts: Date.now(),
            type: "overdue",
            message: `${x.task?.name || t("board.task.untitled", "Untitled")} • ${t("dashboard.due.overdue", "Overdue")}`,
          });
        }
      } else {
        const ids = newOverdue.map((x) => x.idKey).sort().join(",");
        notify({
          id: `overdue:batch:${todayStart}:${ids}`,
          ts: Date.now(),
          type: "overdue",
          message: `${newOverdue.length} ${tasksWord} ${t("dashboard.due.overdue", "Overdue")}`,
        });
      }
    }
    if (notifications.dueToday && newDueToday.length > 0) {
      if (newDueToday.length <= 3) {
        for (const x of newDueToday) {
          notify({
            id: `due_today:${x.idKey}:${todayStart}`,
            ts: Date.now(),
            type: "due_today",
            message: `${x.task?.name || t("board.task.untitled", "Untitled")} • ${t("dashboard.due.today", "Today")}`,
          });
        }
      } else {
        const ids = newDueToday.map((x) => x.idKey).sort().join(",");
        notify({
          id: `due_today:batch:${todayStart}:${ids}`,
          ts: Date.now(),
          type: "due_today",
          message: `${newDueToday.length} ${tasksWord} ${t("dashboard.due.today", "Today")}`,
        });
      }
    }

    notificationStateRef.current = {
      overdueIds: new Set(overdue.map((x) => x.idKey)),
      dueTodayIds: new Set(dueToday.map((x) => x.idKey)),
    };
  }, [appendNotificationLog, playNotificationSound, settings?.notifications, t, user?.id]);

  useEffect(() => {
    todosRef.current = todos || [];
    runNotificationsCheck();
  }, [runNotificationsCheck, todos]);

  useEffect(() => {
    const notifications = settings?.notifications || {};
    if (!notifications.enabled) {
      notificationStateRef.current = { overdueIds: new Set(), dueTodayIds: new Set() };
      return;
    }
    if (!user?.id) return;

    if (notifications.desktop && typeof Notification !== "undefined" && Notification?.permission === "default") {
      Notification.requestPermission().catch(() => undefined);
    }
    runNotificationsCheck();
    const intervalId = window.setInterval(runNotificationsCheck, 5 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, [runNotificationsCheck, settings?.notifications, user?.id]);

  // Force landing view if not authenticated
  useEffect(() => {
    if (!user && activeView !== "landing") {
      setActiveView("landing");
    }
  }, [user, activeView]);

  useEffect(() => {
    document.body.classList.toggle("landing-active", activeView === "landing");
  }, [activeView]);

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
    <div className={`app-root ${activeView === "landing" ? "is-landing" : ""}`}>
      <div className="landing-bg app-global-bg" aria-hidden="true">
        <span className="landing-blob blob-1" />
        <span className="landing-blob blob-2" />
        <span className="landing-blob blob-3" />
        <span className="landing-sparkle sparkle-1" />
        <span className="landing-sparkle sparkle-2" />
        <span className="landing-sparkle sparkle-3" />
      </div>
      <div className="app-content">
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
              <img src={logoImg} alt={t("app.header.logoAlt")} className="logo-nav-img" />
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
          <div className="language-container" style={{ position: 'relative' }} ref={languageContainerRef}>
            <button 
              className={`icon-button ${showLanguagePopup ? 'active' : ''}`}
              title={t('app.header.language')}
              onClick={() => {
                setShowLanguagePopup(!showLanguagePopup);
                setShowSettingsPopup(false);
                setShowNotificationsPopup(false);
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
                    <span className="lang-label">{t(`app.languages.${lang.code}`, lang.label)}</span>
                    {language === lang.code && <CheckIcon className="icon-xs" style={{ marginLeft: 'auto', width: '16px', height: '16px' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="settings-container" style={{ position: 'relative' }} ref={settingsContainerRef}>
            <button 
              className={`icon-button ${showSettingsPopup ? 'active' : ''}`}
              title={t('app.header.settings')}
              onClick={() => {
                setShowSettingsPopup(!showSettingsPopup);
                setShowNotificationsPopup(false);
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
                <span>{t("app.settings.rememberLastView")}</span>
                <button
                  className={`toggle-switch ${settings.rememberLastView ? "active" : ""}`}
                  onClick={() => handleSettingChange("rememberLastView", !settings.rememberLastView)}
                >
                  <div className="toggle-knob"></div>
                </button>
              </div>

              <div className="setting-item">
                <span>
                  {settings.rememberLastView
                    ? t("app.settings.fallbackPage")
                    : t("app.settings.startPage")}
                </span>
                <div className="toggle-group">
                  <button
                    className={`toggle-btn ${settings.startView === "dashboard" ? "active" : ""}`}
                    onClick={() => handleSettingChange("startView", "dashboard")}
                  >
                    {t("app.nav.dashboard")}
                  </button>
                  <button
                    className={`toggle-btn ${settings.startView === "board" ? "active" : ""}`}
                    onClick={() => handleSettingChange("startView", "board")}
                  >
                    {t("app.nav.board")}
                  </button>
                  <button
                    className={`toggle-btn ${settings.startView === "timeline" ? "active" : ""}`}
                    onClick={() => handleSettingChange("startView", "timeline")}
                  >
                    {t("app.nav.timeline")}
                  </button>
                  <button
                    className={`toggle-btn ${settings.startView === "calendar" ? "active" : ""}`}
                    onClick={() => handleSettingChange("startView", "calendar")}
                  >
                    {t("app.nav.calendar")}
                  </button>
                  <button
                    className={`toggle-btn ${settings.startView === "goals" ? "active" : ""}`}
                    onClick={() => handleSettingChange("startView", "goals")}
                  >
                    {t("app.nav.goals")}
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
          <div className="notifications-container" style={{ position: 'relative' }} ref={notificationsContainerRef}>
            <button
              className={`icon-button ${showNotificationsPopup ? 'active' : ''}`}
              title={t('app.settings.notifications')}
              onClick={() => {
                setShowNotificationsPopup(!showNotificationsPopup);
                setShowSettingsPopup(false);
                setShowLanguagePopup(false);
                setShowProfilePopup(false);
              }}
            >
              <BellIcon className="icon-svg" />
              {notificationUnreadCount > 0 && (
                <span className="notification-badge">
                  {notificationUnreadCount > 99 ? "99+" : notificationUnreadCount}
                </span>
              )}
            </button>
            {showNotificationsPopup && (
              <div className="settings-popup notifications-popup">
                <div className="popup-title">{t("app.settings.notifications")}</div>

                <div className="setting-item">
                  <span>{t("app.notifications.enable")}</span>
                  <button
                    className={`toggle-switch ${settings.notifications?.enabled ? "active" : ""}`}
                    onClick={() =>
                      updateNotificationSettings({ enabled: !settings.notifications?.enabled })
                    }
                  >
                    <div className="toggle-knob"></div>
                  </button>
                </div>

                <div className="setting-item">
                  <span>{t("app.notifications.inApp")}</span>
                  <button
                    className={`toggle-switch ${settings.notifications?.inApp ? "active" : ""}`}
                    disabled={!settings.notifications?.enabled}
                    onClick={() =>
                      updateNotificationSettings({ inApp: !settings.notifications?.inApp })
                    }
                  >
                    <div className="toggle-knob"></div>
                  </button>
                </div>

                <div className="setting-item">
                  <span>{t("app.notifications.desktop")}</span>
                  <button
                    className={`toggle-switch ${settings.notifications?.desktop ? "active" : ""}`}
                    disabled={!settings.notifications?.enabled}
                    onClick={() =>
                      updateNotificationSettings({ desktop: !settings.notifications?.desktop })
                    }
                  >
                    <div className="toggle-knob"></div>
                  </button>
                </div>

                <div className="setting-item">
                  <span>{t("app.notifications.dueToday")}</span>
                  <button
                    className={`toggle-switch ${settings.notifications?.dueToday ? "active" : ""}`}
                    disabled={!settings.notifications?.enabled}
                    onClick={() =>
                      updateNotificationSettings({ dueToday: !settings.notifications?.dueToday })
                    }
                  >
                    <div className="toggle-knob"></div>
                  </button>
                </div>

                <div className="setting-item">
                  <span>{t("app.notifications.overdue")}</span>
                  <button
                    className={`toggle-switch ${settings.notifications?.overdue ? "active" : ""}`}
                    disabled={!settings.notifications?.enabled}
                    onClick={() =>
                      updateNotificationSettings({ overdue: !settings.notifications?.overdue })
                    }
                  >
                    <div className="toggle-knob"></div>
                  </button>
                </div>

                <div className="notifications-log">
                  <div className="notifications-log-header">
                    <span className="notifications-log-title">{t("app.notifications.log")}</span>
                    <button
                      type="button"
                      className="notifications-log-clear"
                      disabled={notificationLog.length === 0}
                      onClick={clearNotificationLog}
                    >
                      {t("app.notifications.clear")}
                    </button>
                  </div>

                  <div className="notifications-log-list">
                    {notificationLog.length === 0 ? (
                      <div className="notifications-log-empty">
                        {t("app.notifications.empty")}
                      </div>
                    ) : (
                      notificationLog.map((entry) => (
                        <div
                          key={entry?.id || `${entry?.ts}-${entry?.message}`}
                          className="notifications-log-item"
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            clearNotificationLog();
                            setShowNotificationsPopup(false);
                            handleNavigation("board");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              clearNotificationLog();
                              setShowNotificationsPopup(false);
                              handleNavigation("board");
                            }
                          }}
                        >
                          <div className="notifications-log-message">{entry?.message}</div>
                          <div className="notifications-log-time">
                            {entry?.ts ? new Date(entry.ts).toLocaleString(i18n.language) : ""}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="profile-container" style={{ position: 'relative' }} ref={profileContainerRef}>
            <button
              className={`icon-button ${showProfilePopup ? 'active' : ''}`}
              onClick={() => {
                setShowProfilePopup(!showProfilePopup);
                setShowLanguagePopup(false);
                setShowSettingsPopup(false);
                setShowNotificationsPopup(false);
              }}
              title={t('app.header.profile')}
            >
              {isLoggedIn && user?.picture ? (
                <img 
                  src={user.picture} 
                  alt={t("app.header.profileAlt")}
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
    </div>
    </GoogleOAuthProvider>
  );
}

export default App;
