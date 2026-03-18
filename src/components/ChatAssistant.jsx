import { useState, useRef, useEffect } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  UserCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from "react-i18next";
import './ChatAssistant.css';
import botLogo from '../assets/bot.png';

const ChatAssistant = ({ user, todos, onNavigate }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => [
    { id: 1, text: t("assistant.greeting"), sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const quickActionsRef = useRef(null);
  const containerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const checkScroll = () => {
      if (quickActionsRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = quickActionsRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5); // 5px tolerance
      }
    };

    const currentRef = quickActionsRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      // Initial check
      checkScroll();
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [isOpen]); // Re-check when chat opens

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e) => {
      const container = containerRef.current;
      if (!container) return;
      if (container.contains(e.target)) return;
      setIsOpen(false);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const scrollQuickActions = (direction) => {
    if (quickActionsRef.current) {
      const scrollAmount = 150;
      quickActionsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getMaskStyle = () => {
    const mask = showLeftArrow && showRightArrow 
      ? 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)'
      : showLeftArrow 
        ? 'linear-gradient(to right, transparent, black 20px, black)'
        : showRightArrow 
          ? 'linear-gradient(to right, black, black calc(100% - 20px), transparent)'
          : 'none';
    
    return { 
      WebkitMaskImage: mask,
      maskImage: mask
    };
  };

  const generateResponse = (text) => {
    const lowerText = text.toLowerCase();
    
    // Greetings
    if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('hey')) {
      return t("assistant.responses.greeting");
    }
    
    // Task Statistics
    if (lowerText.includes('task') || lowerText.includes('count') || lowerText.includes('how many')) {
      const count = todos ? todos.length : 0;
      const completed = todos ? todos.filter(t => t.isCompleted).length : 0;
      const pending = count - completed;
      return t("assistant.responses.taskStats", { total: count, completed, pending });
    }

    // Navigation Commands
    if (lowerText.includes('dashboard')) {
      onNavigate && onNavigate('dashboard');
      if (!user) return t("assistant.responses.signInToAccess", { view: t("app.nav.dashboard") });
      return t("assistant.responses.navigatingTo", { view: t("app.nav.dashboard") });
    }

    if (lowerText.includes('board') || lowerText.includes('kanban')) {
      onNavigate && onNavigate('board');
      if (!user) return t("assistant.responses.signInToAccess", { view: t("app.nav.board") });
      return t("assistant.responses.switchingTo", { view: t("app.nav.board") });
    }

    if (lowerText.includes('calendar') || lowerText.includes('schedule')) {
      onNavigate && onNavigate('calendar');
      if (!user) return t("assistant.responses.signInToAccess", { view: t("app.nav.calendar") });
      return t("assistant.responses.openingView", { view: t("app.nav.calendar") });
    }
    
    if (lowerText.includes('goals') || lowerText.includes('target')) {
      onNavigate && onNavigate('goals');
      if (!user) return t("assistant.responses.signInToAccess", { view: t("app.nav.goals") });
      return t("assistant.responses.takingYouTo", { view: t("app.nav.goals") });
    }

    if (lowerText.includes('timeline') || lowerText.includes('gantt')) {
      onNavigate && onNavigate('timeline');
      if (!user) return t("assistant.responses.signInToAccess", { view: t("app.nav.timeline") });
      return t("assistant.responses.showingView", { view: t("app.nav.timeline") });
    }

    // Time/Date
    if (lowerText.includes('time') || lowerText.includes('date') || lowerText.includes('day')) {
      const now = new Date();
      return t("assistant.responses.todayIs", {
        date: now.toLocaleDateString(i18n.language),
        time: now.toLocaleTimeString(i18n.language),
      });
    }

    // Help
    if (lowerText.includes('help') || lowerText.includes('what can you do')) {
      return t("assistant.responses.help");
    }

    // Default
    return t("assistant.responses.default");
  };

  const sendUserMessage = (text) => {
    if (!text.trim()) return;

    const newUserMessage = {
      id: Date.now(),
      text: text,
      sender: 'user'
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate bot thinking and response
    setTimeout(() => {
      const responseText = generateResponse(text);
      const newBotMessage = {
        id: Date.now() + 1,
        text: responseText,
        sender: 'bot'
      };
      setMessages(prev => [...prev, newBotMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickAction = (action) => {
    sendUserMessage(action);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    sendUserMessage(inputValue);
  };

  return (
    <div className="chat-assistant-container" ref={containerRef}>
      <button 
        className={`chat-toggle-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? t("assistant.ui.closeChat") : t("assistant.ui.openChat")}
      >
        <ChatBubbleLeftRightIcon className="icon-svg" />
      </button>

      <div className={`chat-interface ${isOpen ? 'visible' : ''}`}>
        <div className="chat-header">
          <div className="chat-header-info">
            <h3>{t("assistant.ui.title")}</h3>
            <span className="status-indicator">{t("assistant.ui.statusOnline")}</span>
          </div>
        </div>
          
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.sender}`}>
              {msg.sender === 'bot' && (
                <div className="message-icon bot-icon">
                  <img src={botLogo} alt={t("assistant.ui.botAlt")} className="avatar-img" />
                </div>
              )}
              
              <div className={`message-bubble ${msg.sender}`}>
                {msg.text}
              </div>

              {msg.sender === 'user' && (
                <div className="message-icon user-icon">
                  {user && user.picture ? (
                    <img src={user.picture} alt={t("assistant.ui.userAlt")} className="avatar-img" referrerPolicy="no-referrer" />
                  ) : (
                    <UserCircleIcon className="icon-xs" />
                  )}
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="message-row bot">
              <div className="message-icon bot-icon">
                <img src={botLogo} alt={t("assistant.ui.botAlt")} className="avatar-img" />
              </div>
              <div className="message-bubble bot typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="quick-actions-container">
          {showLeftArrow && (
            <button 
              className="scroll-arrow left" 
              onClick={() => scrollQuickActions('left')}
              aria-label={t("assistant.ui.scrollLeft")}
            >
              <ChevronLeftIcon className="icon-sm" />
            </button>
          )}
          
          <div className="quick-actions" ref={quickActionsRef} style={getMaskStyle()}>
            <button onClick={() => handleQuickAction("How many tasks do I have?")}>
              📊 {t("assistant.quickActions.taskCount")}
            </button>
            <button onClick={() => handleQuickAction("Go to Dashboard")}>
              🏠 {t("assistant.quickActions.dashboard")}
            </button>
            <button onClick={() => handleQuickAction("Show Calendar")}>
              📅 {t("assistant.quickActions.calendar")}
            </button>
            <button onClick={() => handleQuickAction("Open Board View")}>
              📋 {t("assistant.quickActions.board")}
            </button>
            <button onClick={() => handleQuickAction("Check Goals")}>
              🎯 {t("assistant.quickActions.goals")}
            </button>
          </div>

          {showRightArrow && (
            <button 
              className="scroll-arrow right" 
              onClick={() => scrollQuickActions('right')}
              aria-label={t("assistant.ui.scrollRight")}
            >
              <ChevronRightIcon className="icon-sm" />
            </button>
          )}
        </div>

        <form className="chat-input-area" onSubmit={handleSendMessage}>
          {inputValue.length > 0 && <span className="user-typing">{t("assistant.ui.userTyping")}</span>}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t("assistant.ui.placeholder")}
            className="chat-input"
          />
          <button type="submit" className="send-btn" aria-label={t("assistant.ui.send")}></button>
        </form>
      </div>
    </div>
  );
};

export default ChatAssistant;
