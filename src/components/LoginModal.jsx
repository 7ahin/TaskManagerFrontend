import React, { useState } from 'react';
import './LoginModal.css';
import { GoogleLogin } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from '@heroicons/react/24/outline';
import logoImg from '../assets/logo.png';

const LoginModal = ({ onClose, onLoginSuccess, onLoginError, customTitle, customMessage }) => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content login-modal-card" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="icon-button close-button" 
          onClick={onClose}
        >
          <XMarkIcon className="icon-svg" />
        </button>

        <div className="login-header">
          <img src={logoImg} alt="Task Senpai" className="login-logo" />
          <h1>{customTitle || t('app.title', 'Task Senpai')}</h1>
          <p className="login-subtitle">
            {customMessage || (isLogin 
              ? t('app.login.welcome_back', 'Welcome back! Please sign in to continue.') 
              : t('app.login.join_us', 'Join us and start organizing your life.'))}
          </p>
        </div>

        <div className="login-content">
          <div className="auth-toggle">
            <button 
              className={`toggle-btn ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              {t('app.profile.login', 'Login')}
            </button>
            <button 
              className={`toggle-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              {t('app.profile.signup', 'Sign Up')}
            </button>
          </div>

          <div className="google-btn-wrapper">
            <GoogleLogin
              onSuccess={onLoginSuccess}
              onError={onLoginError}
              theme="filled_black"
              shape="pill"
              size="large"
              width="100%"
              text={isLogin ? "signin_with" : "signup_with"}
            />
          </div>

          <div className="divider">
            <span>{t('app.login.or', 'or')}</span>
          </div>

          <div className="guest-option">
            <button className="text-btn" onClick={onClose}>
              {t('app.login.continue_guest', 'Continue as Guest')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
