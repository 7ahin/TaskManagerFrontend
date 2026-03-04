import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import '../App.css'; // Ensure we have access to modal styles

const LoginModal = ({ onClose, onLoginSuccess, onLoginError }) => {
  const { t } = useTranslation();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content login-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="icon-button close-button" 
          onClick={onClose}
        >
          <XMarkIcon className="icon-svg" />
        </button>
        
        <h2>
          {t('app.profile.login_title', 'Welcome Back')}
        </h2>
        
        <p>
          {t('app.profile.login_desc', 'Sign in to sync your tasks across devices.')}
        </p>
        
        <div className="login-google-wrapper">
          <GoogleLogin
            onSuccess={onLoginSuccess}
            onError={onLoginError}
            theme="filled_blue"
            shape="pill"
            size="large"
            width="250"
          />
        </div>
        
        <div className="login-footer">
          {t('app.profile.login_terms', 'By continuing, you agree to our Terms of Service and Privacy Policy.')}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
