import { useMemo, useState } from "react";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  MusicalNoteIcon,
  SparklesIcon,
  Squares2X2Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import "./TutorialOverlay.css";
import logoImg from "../assets/logo.png";

function TutorialIllustration({ stepId }) {
  if (stepId === "welcome") {
    return (
      <div className="tutorial-illustration tutorial-illustration-welcome" aria-hidden="true">
        <div className="tutorial-illustration-hero">
          <div className="tutorial-illustration-badge">
            <SparklesIcon className="tutorial-illustration-icon" aria-hidden="true" />
            <span>Task Senpai</span>
          </div>
          <div className="tutorial-illustration-lines">
            <div className="tutorial-illustration-line is-wide" />
            <div className="tutorial-illustration-line" />
            <div className="tutorial-illustration-line is-short" />
          </div>
        </div>
        <div className="tutorial-illustration-row">
          <div className="tutorial-illustration-chip is-active" />
          <div className="tutorial-illustration-chip" />
          <div className="tutorial-illustration-chip" />
        </div>
        <div className="tutorial-illustration-grid">
          <div className="tutorial-illustration-card" />
          <div className="tutorial-illustration-card" />
          <div className="tutorial-illustration-card" />
        </div>
      </div>
    );
  }

  if (stepId === "dashboard") {
    return (
      <div className="tutorial-illustration tutorial-illustration-dashboard" aria-hidden="true">
        <div className="tutorial-illustration-top">
          <div className="tutorial-illustration-pill">
            <ChartBarIcon className="tutorial-illustration-icon" aria-hidden="true" />
            <span>Dashboard</span>
          </div>
          <div className="tutorial-illustration-kpi">
            <div className="tutorial-illustration-kpi-num" />
            <div className="tutorial-illustration-kpi-label" />
          </div>
        </div>
        <div className="tutorial-illustration-grid is-2">
          <div className="tutorial-illustration-card is-tall" />
          <div className="tutorial-illustration-card is-tall" />
        </div>
        <div className="tutorial-illustration-list">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="tutorial-illustration-list-item">
              <span className="tutorial-illustration-dot" />
              <span className="tutorial-illustration-line is-wide" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stepId === "board") {
    return (
      <div className="tutorial-illustration tutorial-illustration-board" aria-hidden="true">
        <div className="tutorial-illustration-top">
          <div className="tutorial-illustration-pill">
            <Squares2X2Icon className="tutorial-illustration-icon" aria-hidden="true" />
            <span>Board</span>
          </div>
          <div className="tutorial-illustration-pill is-muted">
            <ClipboardDocumentListIcon className="tutorial-illustration-icon" aria-hidden="true" />
            <span>+ Task</span>
          </div>
        </div>
        <div className="tutorial-illustration-columns">
          {["To do", "Doing", "Done"].map((label) => (
            <div key={label} className="tutorial-illustration-column">
              <div className="tutorial-illustration-column-title">{label}</div>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="tutorial-illustration-card is-task">
                  <span className="tutorial-illustration-line is-wide" />
                  <span className="tutorial-illustration-line is-short" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stepId === "calendar") {
    return (
      <div className="tutorial-illustration tutorial-illustration-calendar" aria-hidden="true">
        <div className="tutorial-illustration-top">
          <div className="tutorial-illustration-pill">
            <CalendarDaysIcon className="tutorial-illustration-icon" aria-hidden="true" />
            <span>Calendar</span>
          </div>
        </div>
        <div className="tutorial-illustration-calendar-grid">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className={`tutorial-illustration-calendar-day ${i === 9 ? "is-selected" : ""}`} />
          ))}
        </div>
        <div className="tutorial-illustration-row">
          <div className="tutorial-illustration-tag" />
          <div className="tutorial-illustration-tag is-muted" />
          <div className="tutorial-illustration-tag" />
        </div>
      </div>
    );
  }

  if (stepId === "goals") {
    return (
      <div className="tutorial-illustration tutorial-illustration-goals" aria-hidden="true">
        <div className="tutorial-illustration-top">
          <div className="tutorial-illustration-pill">
            <CheckCircleIcon className="tutorial-illustration-icon" aria-hidden="true" />
            <span>Goals</span>
          </div>
          <div className="tutorial-illustration-pill is-accent">
            <span>+ Goal</span>
          </div>
        </div>
        <div className="tutorial-illustration-card is-form">
          <span className="tutorial-illustration-line is-wide" />
          <div className="tutorial-illustration-row">
            <span className="tutorial-illustration-input" />
            <span className="tutorial-illustration-input" />
          </div>
          <div className="tutorial-illustration-row">
            <span className="tutorial-illustration-tag is-muted" />
            <span className="tutorial-illustration-tag" />
          </div>
          <div className="tutorial-illustration-actions">
            <span className="tutorial-illustration-btn is-muted" />
            <span className="tutorial-illustration-btn is-accent" />
          </div>
        </div>
        <div className="tutorial-illustration-list">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="tutorial-illustration-list-item">
              <span className="tutorial-illustration-dot is-accent" />
              <span className="tutorial-illustration-line is-wide" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stepId === "assistant") {
    return (
      <div className="tutorial-illustration tutorial-illustration-assistant" aria-hidden="true">
        <div className="tutorial-illustration-top">
          <div className="tutorial-illustration-pill">
            <SparklesIcon className="tutorial-illustration-icon" aria-hidden="true" />
            <span>Assistant</span>
          </div>
        </div>
        <div className="tutorial-illustration-chat">
          <div className="tutorial-illustration-bubble is-bot" />
          <div className="tutorial-illustration-bubble is-user" />
          <div className="tutorial-illustration-bubble is-bot is-wide" />
        </div>
        <div className="tutorial-illustration-row">
          <span className="tutorial-illustration-chip is-active" />
          <span className="tutorial-illustration-chip" />
          <span className="tutorial-illustration-chip" />
        </div>
      </div>
    );
  }

  if (stepId === "music") {
    return (
      <div className="tutorial-illustration tutorial-illustration-music" aria-hidden="true">
        <div className="tutorial-illustration-top">
          <div className="tutorial-illustration-pill">
            <MusicalNoteIcon className="tutorial-illustration-icon" aria-hidden="true" />
            <span>Focus Music</span>
          </div>
        </div>
        <div className="tutorial-illustration-card is-player">
          <div className="tutorial-illustration-row">
            <span className="tutorial-illustration-cover" />
            <div className="tutorial-illustration-lines">
              <div className="tutorial-illustration-line is-wide" />
              <div className="tutorial-illustration-line is-short" />
            </div>
          </div>
          <div className="tutorial-illustration-progress">
            <span className="tutorial-illustration-progress-bar" />
          </div>
          <div className="tutorial-illustration-controls">
            <span className="tutorial-illustration-btn is-muted" />
            <span className="tutorial-illustration-btn is-accent" />
            <span className="tutorial-illustration-btn is-muted" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function TutorialOverlay({ onClose }) {
  const { t } = useTranslation();
  const steps = useMemo(
    () => [
      { id: "welcome", labelKey: "tutorial.steps.welcome.label", titleKey: "tutorial.steps.welcome.title", descKey: "tutorial.steps.welcome.desc", bulletsKey: "tutorial.steps.welcome.bullets" },
      { id: "dashboard", labelKey: "tutorial.steps.dashboard.label", titleKey: "tutorial.steps.dashboard.title", descKey: "tutorial.steps.dashboard.desc", bulletsKey: "tutorial.steps.dashboard.bullets" },
      { id: "board", labelKey: "tutorial.steps.board.label", titleKey: "tutorial.steps.board.title", descKey: "tutorial.steps.board.desc", bulletsKey: "tutorial.steps.board.bullets" },
      { id: "calendar", labelKey: "tutorial.steps.calendar.label", titleKey: "tutorial.steps.calendar.title", descKey: "tutorial.steps.calendar.desc", bulletsKey: "tutorial.steps.calendar.bullets" },
      { id: "goals", labelKey: "tutorial.steps.goals.label", titleKey: "tutorial.steps.goals.title", descKey: "tutorial.steps.goals.desc", bulletsKey: "tutorial.steps.goals.bullets" },
      { id: "assistant", labelKey: "tutorial.steps.assistant.label", titleKey: "tutorial.steps.assistant.title", descKey: "tutorial.steps.assistant.desc", bulletsKey: "tutorial.steps.assistant.bullets" },
      { id: "music", labelKey: "tutorial.steps.music.label", titleKey: "tutorial.steps.music.title", descKey: "tutorial.steps.music.desc", bulletsKey: "tutorial.steps.music.bullets" },
      { id: "finish", labelKey: "tutorial.steps.finish.label", titleKey: "tutorial.steps.finish.title", descKey: "tutorial.steps.finish.desc", bulletsKey: "tutorial.steps.finish.bullets" },
    ],
    []
  );

  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const bulletsRaw = t(step.bulletsKey, { returnObjects: true });
  const bullets = Array.isArray(bulletsRaw) ? bulletsRaw : [];

  const canGoBack = currentStep > 0;
  const canGoNext = currentStep < steps.length - 1;

  const handleNext = () => {
    if (!canGoNext) {
      onClose();
      return;
    }
    setCurrentStep((v) => Math.min(steps.length - 1, v + 1));
  };

  const handleBack = () => {
    if (!canGoBack) return;
    setCurrentStep((v) => Math.max(0, v - 1));
  };

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-label={t("tutorial.title")}>
      <div className="tutorial-backdrop" onClick={onClose} />

      <div className="tutorial-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tutorial-modal-header">
          <div className="tutorial-brand">
            <img src={logoImg} alt={t("tutorial.logoAlt")} className="tutorial-brand-logo" />
            <div className="tutorial-brand-text">
              <div className="tutorial-brand-title">{t("tutorial.title")}</div>
              <div className="tutorial-brand-subtitle">{t("tutorial.subtitle")}</div>
            </div>
          </div>
          <button type="button" className="tutorial-close" onClick={onClose} aria-label={t("tutorial.actions.close")}>
            <XMarkIcon className="tutorial-close-icon" aria-hidden="true" />
          </button>
        </div>

        <div className="tutorial-modal-body">
          <nav className="tutorial-steps" aria-label={t("tutorial.stepsNavLabel")}>
            {steps.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                className={`tutorial-step ${idx === currentStep ? "is-active" : ""}`}
                onClick={() => setCurrentStep(idx)}
              >
                <span className="tutorial-step-index">{idx + 1}</span>
                <span className="tutorial-step-label">{t(s.labelKey)}</span>
                <ArrowRightIcon className="tutorial-step-arrow" aria-hidden="true" />
              </button>
            ))}
          </nav>

          <section className="tutorial-panel">
            <div className="tutorial-panel-content">
              <div className="tutorial-panel-preview">
                <TutorialIllustration stepId={step.id} />
              </div>
              <h3 className="tutorial-title">{t(step.titleKey)}</h3>
              <p className="tutorial-text">{t(step.descKey)}</p>
              {bullets.length ? (
                <ul className="tutorial-bullets">
                  {bullets.map((b, i) => (
                    <li key={i} className="tutorial-bullet">
                      {b}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        </div>

        <div className="tutorial-modal-footer">
          <div className="tutorial-progress">
            {currentStep + 1} / {steps.length}
          </div>
          <div className="tutorial-actions">
            <button type="button" className="tutorial-btn secondary" onClick={onClose}>
              {t("tutorial.actions.close")}
            </button>
            <button type="button" className="tutorial-btn secondary" onClick={handleBack} disabled={!canGoBack}>
              <ChevronLeftIcon className="tutorial-btn-icon" aria-hidden="true" />
              {t("tutorial.actions.back")}
            </button>
            <button type="button" className="tutorial-btn primary" onClick={handleNext}>
              {canGoNext ? t("tutorial.actions.next") : t("tutorial.actions.finish")}
              <ChevronRightIcon className="tutorial-btn-icon" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorialOverlay;
