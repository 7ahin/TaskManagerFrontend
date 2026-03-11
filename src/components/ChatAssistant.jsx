import React, { useState, useRef, useEffect } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  UserCircleIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import './ChatAssistant.css';
import botLogo from '../assets/bot.png';

const ChatAssistant = ({ user, todos, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your assistant bot. How can I help you today?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const quickActionsRef = useRef(null);
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
      return "Hello there! How can I assist you with your tasks today?";
    }
    
    // Task Statistics
    if (lowerText.includes('task') || lowerText.includes('count') || lowerText.includes('how many')) {
      const count = todos ? todos.length : 0;
      const completed = todos ? todos.filter(t => t.isCompleted).length : 0;
      const pending = count - completed;
      return `You have ${count} total tasks: ${completed} completed and ${pending} pending. Keep up the good work!`;
    }

    // Navigation Commands
    if (lowerText.includes('dashboard')) {
      onNavigate && onNavigate('dashboard');
      if (!user) return "Please sign in to access the Dashboard.";
      return "Navigating to Dashboard...";
    }

    if (lowerText.includes('board') || lowerText.includes('kanban')) {
      onNavigate && onNavigate('board');
      if (!user) return "Please sign in to access the Board.";
      return "Switching to Board view...";
    }

    if (lowerText.includes('calendar') || lowerText.includes('schedule')) {
      onNavigate && onNavigate('calendar');
      if (!user) return "Please sign in to access the Calendar.";
      return "Opening Calendar view...";
    }
    
    if (lowerText.includes('goals') || lowerText.includes('target')) {
      onNavigate && onNavigate('goals');
      if (!user) return "Please sign in to access Goals.";
      return "Taking you to Goals view...";
    }

    if (lowerText.includes('timeline') || lowerText.includes('gantt')) {
      onNavigate && onNavigate('timeline');
      if (!user) return "Please sign in to access the Timeline.";
      return "Showing Timeline view...";
    }

    // Time/Date
    if (lowerText.includes('time') || lowerText.includes('date') || lowerText.includes('day')) {
      return `Today is ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    }

    // Help
    if (lowerText.includes('help') || lowerText.includes('what can you do')) {
      return "I can help you check your tasks or navigate the app. Try asking 'How many tasks?', 'Go to Board', 'Show Calendar', or 'Check Goals'.";
    }

    // Default
    return "I'm still learning. Try asking about your tasks, navigation, or check the Quick Actions below!";
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
    <div className="chat-assistant-container">
      <button 
        className={`chat-toggle-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Close Chat" : "Open Chat"}
      >
        <ChatBubbleLeftRightIcon className="icon-svg" />
      </button>

      <div className={`chat-interface ${isOpen ? 'visible' : ''}`}>
        <div className="chat-header">
          <div className="chat-header-info">
            <h3>Assistant Bot</h3>
            <span className="status-indicator">Online</span>
          </div>
          <button className="close-btn" onClick={() => setIsOpen(false)} aria-label="Close chat">
            &times;
          </button>
        </div>
          
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.sender}`}>
              {msg.sender === 'bot' && (
                <div className="message-icon bot-icon">
                  <img src={botLogo} alt="Bot" className="avatar-img" />
                </div>
              )}
              
              <div className={`message-bubble ${msg.sender}`}>
                {msg.text}
              </div>

              {msg.sender === 'user' && (
                <div className="message-icon user-icon">
                  {user && user.picture ? (
                    <img src={user.picture} alt="User" className="avatar-img" referrerPolicy="no-referrer" />
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
                <img src={botLogo} alt="Bot" className="avatar-img" />
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
              aria-label="Scroll left"
            >
              <ChevronLeftIcon className="icon-sm" />
            </button>
          )}
          
          <div className="quick-actions" ref={quickActionsRef} style={getMaskStyle()}>
            <button onClick={() => handleQuickAction("How many tasks do I have?")}>
              📊 Task Count
            </button>
            <button onClick={() => handleQuickAction("Go to Dashboard")}>
              🏠 Dashboard
            </button>
            <button onClick={() => handleQuickAction("Show Calendar")}>
              📅 Calendar
            </button>
            <button onClick={() => handleQuickAction("Open Board View")}>
              📋 Board
            </button>
            <button onClick={() => handleQuickAction("Check Goals")}>
              🎯 Goals
            </button>
          </div>

          {showRightArrow && (
            <button 
              className="scroll-arrow right" 
              onClick={() => scrollQuickActions('right')}
              aria-label="Scroll right"
            >
              <ChevronRightIcon className="icon-sm" />
            </button>
          )}
        </div>

        <form className="chat-input-area" onSubmit={handleSendMessage}>
          {inputValue.length > 0 && <span className="user-typing">User is typing...</span>}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="chat-input"
          />
          <button type="submit" className="send-btn" aria-label="Send message"></button>
        </form>
      </div>
    </div>
  );
};

export default ChatAssistant;
