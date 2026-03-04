import React, { useState } from "react";
import "./TutorialOverlay.css";
import logoImg from "../assets/logo.png"; // Assuming logo is available

const STEPS = [
  {
    target: "center",
    title: "Welcome to Task Senpai!",
    content: "I'm your personal productivity assistant. Let me show you around in a quick tour.",
    position: "center"
  },
  {
    target: ".app-nav-tab:nth-child(1)", // Dashboard
    title: "Dashboard",
    content: "Start your day here. Get a high-level overview of your tasks and progress.",
    position: "top-left"
  },
  {
    target: ".app-nav-tab:nth-child(2)", // Board
    title: "Kanban Board",
    content: "Visualize your workflow. Drag and drop tasks to update their status instantly.",
    position: "top-center"
  },
  {
    target: ".app-nav-tab:nth-child(3)", // Timeline
    title: "Timeline View",
    content: "Plan ahead. See your schedule on a timeline to manage deadlines effectively.",
    position: "top-center"
  },
  {
    target: ".app-nav-tab:nth-child(5)", // Goals
    title: "Goals",
    content: "Dream big. Set long-term goals and break them down into actionable steps.",
    position: "top-right"
  },
  {
    target: "center",
    title: "You're All Set!",
    content: "That's the basics. Go ahead and start organizing your life!",
    position: "center"
  }
];

function TutorialOverlay({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  // Calculate position style based on step.position
  // Ideally we would measure the target element, but for simplicity we'll use fixed classes
  // or a simple heuristic.
  
  return (
    <div className="tutorial-overlay">
      <div className="tutorial-backdrop" />
      
      {/* Spotlight effect could be added here if we had precise coordinates */}
      
      <div className={`tutorial-card ${step.position}`}>
        <div className="tutorial-senpai">
            <img src={logoImg} alt="Senpai" className="senpai-avatar" />
        </div>
        <div className="tutorial-content">
          <h3 className="tutorial-title">{step.title}</h3>
          <p className="tutorial-text">{step.content}</p>
          <div className="tutorial-actions">
            <button className="tutorial-btn secondary" onClick={handleSkip}>
              {currentStep === STEPS.length - 1 ? "Close" : "Skip"}
            </button>
            <button className="tutorial-btn primary" onClick={handleNext}>
              {currentStep === STEPS.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
          <div className="tutorial-progress">
            {currentStep + 1} / {STEPS.length}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorialOverlay;
