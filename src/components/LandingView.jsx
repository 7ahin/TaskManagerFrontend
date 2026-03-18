import React, { useMemo, useState } from 'react';
import {
  ArrowsUpDownIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  MusicalNoteIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import './LandingView.css';

function LandingView({ onGetStarted, onStartTutorial, mascotSrc = "/senpai-girl.png" }) {
  const { t } = useTranslation();
  const previewTabs = useMemo(
    () => [
      {
        id: "dashboard",
        label: t("landing.previewTabs.dashboard.label"),
        title: t("landing.previewTabs.dashboard.title"),
        desc: t("landing.previewTabs.dashboard.desc"),
      },
      {
        id: "board",
        label: t("landing.previewTabs.board.label"),
        title: t("landing.previewTabs.board.title"),
        desc: t("landing.previewTabs.board.desc"),
      },
      {
        id: "timeline",
        label: t("landing.previewTabs.timeline.label"),
        title: t("landing.previewTabs.timeline.title"),
        desc: t("landing.previewTabs.timeline.desc"),
      },
      {
        id: "calendar",
        label: t("landing.previewTabs.calendar.label"),
        title: t("landing.previewTabs.calendar.title"),
        desc: t("landing.previewTabs.calendar.desc"),
      },
      {
        id: "goals",
        label: t("landing.previewTabs.goals.label"),
        title: t("landing.previewTabs.goals.title"),
        desc: t("landing.previewTabs.goals.desc"),
      },
    ],
    [t]
  );
  const [activePreview, setActivePreview] = useState(previewTabs[1]?.id || "board");
  const activePreviewMeta = useMemo(
    () => previewTabs.find((t) => t.id === activePreview) || previewTabs[0],
    [activePreview, previewTabs]
  );

  return (
    <div className="landing-container">
      <div className="landing-hero">
        <div className="landing-kicker">
          <span className="landing-kicker-pill">{t("landing.kicker.focus")}</span>
          <span className="landing-kicker-dot" aria-hidden="true" />
          <span className="landing-kicker-pill">{t("landing.kicker.plan")}</span>
          <span className="landing-kicker-dot" aria-hidden="true" />
          <span className="landing-kicker-pill">{t("landing.kicker.achieve")}</span>
        </div>
        <h1 className="landing-title">
          {t("landing.hero.title")} <br />
          <span className="landing-highlight">{t("landing.hero.highlight")}</span>
        </h1>
        <div className="landing-jp-tagline">{t("landing.hero.jpTagline")}</div>
        <p className="landing-subtitle">
          {t("landing.hero.subtitle")}
        </p>
        <div className="landing-badges" aria-label="Capabilities">
          <span className="landing-badge">{t("landing.capabilities.kanban")}</span>
          <span className="landing-badge">{t("landing.capabilities.timeline")}</span>
          <span className="landing-badge">{t("landing.capabilities.calendar")}</span>
          <span className="landing-badge">{t("landing.capabilities.goals")}</span>
          <span className="landing-badge">{t("landing.capabilities.assistant")}</span>
          <span className="landing-badge">{t("landing.capabilities.music")}</span>
        </div>
        <div className="landing-actions">
          <button className="landing-btn-primary" onClick={onGetStarted}>
            {t("landing.actions.startFree")}
          </button>
          <button className="landing-btn-secondary" onClick={onStartTutorial}>
            {t("landing.actions.viewDemo")}
          </button>
        </div>
        
        {/* Social Proof */}
        <div className="landing-social-proof">
          <p className="social-proof-text">{t("landing.socialProof.label")}</p>
          <div className="social-proof-logos">
            <span className="landing-brandmark">{t("landing.socialProof.team")}</span>
          </div>
        </div>

      </div>

      {/* App Preview Mockup */}
      <div className="landing-mockup-section">
        <div className="landing-mascot" aria-hidden="true">
          <img className="landing-mascot-img" src={mascotSrc} alt="" draggable={false} />
        </div>
        <div className="landing-mockup-card">
          <div className="landing-preview">
            <div className="landing-preview-topbar">
              <div className="landing-preview-left">
                <div className="landing-preview-logo" aria-hidden="true" />
                <div className="landing-preview-brand">{t("landing.preview.brand")}</div>
              </div>
              <div className="landing-preview-nav" role="tablist" aria-label="Preview views">
                {previewTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activePreview === tab.id}
                    className={`landing-preview-nav-item ${activePreview === tab.id ? "is-active" : ""}`}
                    onClick={() => setActivePreview(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="landing-preview-right" aria-hidden="true">
                <span className="landing-preview-icon" />
                <span className="landing-preview-icon" />
                <span className="landing-preview-pill" />
              </div>
            </div>

            <div className="landing-preview-surface">
              <div className="landing-preview-header">
                <div className="landing-preview-heading">
                  <div className="landing-preview-title" />
                  <div className="landing-preview-subtitle" />
                </div>
                <div className="landing-preview-search" />
              </div>

              <div className="landing-preview-chips" aria-hidden="true">
                <span className="landing-preview-chip is-active" />
                <span className="landing-preview-chip" />
                <span className="landing-preview-chip" />
                <span className="landing-preview-chip" />
                <span className="landing-preview-chip" />
                <span className="landing-preview-chip" />
                <span className="landing-preview-chip" />
                <span className="landing-preview-chip" />
              </div>

              <div className="landing-preview-addrow" aria-hidden="true">
                <div className="landing-preview-input" />
                <div className="landing-preview-btn" />
                <div className="landing-preview-btn primary" />
              </div>

              <div className="landing-preview-columns" aria-hidden="true">
                <div className="landing-preview-column">
                  <div className="landing-preview-col-header">
                    <span className="landing-preview-dot" />
                    <span className="landing-preview-col-title" />
                    <span className="landing-preview-count" />
                  </div>
                  <div className="landing-preview-card">
                    <div className="landing-preview-tag" />
                    <div className="landing-preview-card-title" />
                    <div className="landing-preview-card-meta" />
                  </div>
                </div>
                <div className="landing-preview-column">
                  <div className="landing-preview-col-header">
                    <span className="landing-preview-dot stuck" />
                    <span className="landing-preview-col-title" />
                    <span className="landing-preview-count" />
                  </div>
                  <div className="landing-preview-card muted" />
                  <div className="landing-preview-card muted" />
                </div>
                <div className="landing-preview-column">
                  <div className="landing-preview-col-header">
                    <span className="landing-preview-dot done" />
                    <span className="landing-preview-col-title" />
                    <span className="landing-preview-count" />
                  </div>
                  <div className="landing-preview-card muted" />
                </div>
              </div>
            </div>
          </div>
          <div className="landing-preview-caption" aria-live="polite">
            <div className="landing-preview-caption-title">{activePreviewMeta?.title}</div>
            <div className="landing-preview-caption-desc">{activePreviewMeta?.desc}</div>
          </div>
        </div>
      </div>
      
      <div className="landing-section-title">
        <h2>{t("landing.featuresSection.title")}</h2>
        <p>{t("landing.featuresSection.subtitle")}</p>
      </div>

      <div className="landing-features-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <ClipboardDocumentListIcon className="feature-icon-svg" aria-hidden="true" />
          </div>
          <h3 className="feature-title">{t("landing.features.smartFlow.title")}</h3>
          <p className="feature-desc">{t("landing.features.smartFlow.desc")}</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <Squares2X2Icon className="feature-icon-svg" aria-hidden="true" />
          </div>
          <h3 className="feature-title">{t("landing.features.dragDrop.title")}</h3>
          <p className="feature-desc">{t("landing.features.dragDrop.desc")}</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <CalendarDaysIcon className="feature-icon-svg" aria-hidden="true" />
          </div>
          <h3 className="feature-title">{t("landing.features.calendarClarity.title")}</h3>
          <p className="feature-desc">{t("landing.features.calendarClarity.desc")}</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <ArrowsUpDownIcon className="feature-icon-svg" aria-hidden="true" />
          </div>
          <h3 className="feature-title">{t("landing.features.timelinePlanning.title")}</h3>
          <p className="feature-desc">{t("landing.features.timelinePlanning.desc")}</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <ChatBubbleLeftRightIcon className="feature-icon-svg" aria-hidden="true" />
          </div>
          <h3 className="feature-title">{t("landing.features.assistantBot.title")}</h3>
          <p className="feature-desc">{t("landing.features.assistantBot.desc")}</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <MusicalNoteIcon className="feature-icon-svg" aria-hidden="true" />
          </div>
          <h3 className="feature-title">{t("landing.features.focusMode.title")}</h3>
          <p className="feature-desc">{t("landing.features.focusMode.desc")}</p>
        </div>
      </div>
      
      {/* Call to Action Section */}
      <div className="landing-cta-section">
        <h2 className="cta-title">{t("landing.cta.title")}</h2>
        <p className="cta-subtitle">{t("landing.cta.subtitle")}</p>
        <button className="landing-btn-primary" onClick={onGetStarted}>
          {t("landing.cta.button")}
        </button>
      </div>
      
      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-left">
           <span className="landing-footer-brand">{t("landing.footer.brand")}</span>
           <span className="landing-footer-copy">&copy; {new Date().getFullYear()}</span>
        </div>
        <div className="footer-links">
          <a href="#" className="footer-link">{t("landing.footer.privacy")}</a>
          <a href="#" className="footer-link">{t("landing.footer.terms")}</a>
          <a href="https://x.com/yurechan14" target="_blank" rel="noopener noreferrer" className="footer-link icon-link" title="X (Twitter)">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a href="https://github.com/7ahin" target="_blank" rel="noopener noreferrer" className="footer-link icon-link" title="GitHub">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default LandingView;
