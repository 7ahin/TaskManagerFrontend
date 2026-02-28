import React from 'react';
import './LandingView.css';

function LandingView({ onGetStarted }) {
  return (
    <div className="landing-container">
      <div className="landing-hero">
        <h1 className="landing-title">
          Task Senpai <br />
          <span className="landing-highlight">Master Your Workflow</span>
        </h1>
        <p className="landing-subtitle">
          Organize, prioritize, and track your work with ease. 
          The ultimate tool for personal and professional productivity.
        </p>
        <div className="landing-actions">
          <button className="landing-btn-primary" onClick={onGetStarted}>
            Start for free
          </button>
          <button className="landing-btn-secondary" onClick={onGetStarted}>
            View Demo
          </button>
        </div>
        
        {/* Social Proof */}
        <div className="landing-social-proof">
          <p className="social-proof-text">Designed & Built by</p>
          <div className="social-proof-logos">
             {/* Personal Branding */}
             <span style={{
               fontWeight: 800, 
               fontSize: '1.5rem', 
               background: 'linear-gradient(to right, #fff, #9ca3af)', 
               WebkitBackgroundClip: 'text',
               WebkitTextFillColor: 'transparent',
               opacity: 0.9,
               letterSpacing: '1px'
             }}>
               HINNTERESTING
             </span>
          </div>
        </div>
      </div>

      {/* App Preview Mockup */}
      <div className="landing-mockup-section">
        <div className="landing-mockup-card">
          <div className="mockup-header">
            <div style={{display:'flex', gap:'8px', alignItems:'center', height:'100%', paddingLeft:'16px'}}>
               <div style={{width:'12px', height:'12px', borderRadius:'50%', background:'#ef4444'}}></div>
               <div style={{width:'12px', height:'12px', borderRadius:'50%', background:'#f59e0b'}}></div>
               <div style={{width:'12px', height:'12px', borderRadius:'50%', background:'#10b981'}}></div>
            </div>
          </div>
          <div className="mockup-grid">
            <div className="mockup-col">
              <div className="mockup-item"></div>
              <div className="mockup-item"></div>
              <div className="mockup-item" style={{ height: '100px' }}></div>
            </div>
            <div className="mockup-col">
              <div className="mockup-item"></div>
              <div className="mockup-item" style={{ height: '80px' }}></div>
              <div className="mockup-item"></div>
            </div>
            <div className="mockup-col">
              <div className="mockup-item" style={{ height: '120px' }}></div>
              <div className="mockup-item"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Grid */}
      <div className="landing-features-grid">
        <div className="feature-card">
          <div className="feature-icon">🚀</div>
          <h3 className="feature-title">Fast & Fluid</h3>
          <p className="feature-desc">Experience zero latency with our optimized board views and instant updates.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">✨</div>
          <h3 className="feature-title">Visual Planning</h3>
          <p className="feature-desc">See your projects come to life with intuitive Kanban boards and timelines.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3 className="feature-title">Secure by Design</h3>
          <p className="feature-desc">Your data is yours. Built with enterprise-grade security standards.</p>
        </div>
      </div>
      
      {/* Call to Action Section */}
      <div className="landing-cta-section">
        <h2 className="cta-title">Ready to take control?</h2>
        <p className="cta-subtitle">Join thousands of users organizing their life with Task Senpai.</p>
        <button className="landing-btn-primary" onClick={onGetStarted}>
          Get Started Now
        </button>
      </div>
      
      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-left">
           <span style={{fontWeight:'700', color:'#fff'}}>Task Senpai</span>
           <span style={{marginLeft:'1rem', opacity:0.6}}>&copy; {new Date().getFullYear()}</span>
        </div>
        <div className="footer-links">
          <a href="#" className="footer-link">Privacy</a>
          <a href="#" className="footer-link">Terms</a>
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
