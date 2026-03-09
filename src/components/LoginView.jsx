import React, { useState } from 'react';
import './LoginView.css';
import { GoogleLogin } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import logoImg from '../assets/logo.png';

function LoginView({ onLoginSuccess, onLoginError, onBack }) {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="login-view-container">
      <div className="login-card">
        <div className="login-header">
          <img src={logoImg} alt="Task Senpai" className="login-logo" />
          <h1>{t('app.title', 'Task Senpai')}</h1>
          <p className="login-subtitle">
            {isLogin 
              ? t('app.login.welcome_back', 'Welcome back! Please sign in to continue.') 
              : t('app.login.join_us', 'Join us and start organizing your life.')}
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
            <button className="text-btn" onClick={onBack}>
              {t('app.login.continue_guest', 'Continue as Guest')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginView;
