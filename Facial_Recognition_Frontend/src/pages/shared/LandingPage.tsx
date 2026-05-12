import React from 'react';
import { Link } from 'react-router-dom';
import FaceModelBg from '../../assets/Face_model.png';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page dark">
      {/* TopNavBar */}
      <nav className="landing-nav">
        <div className="landing-nav-container">
          <Link to="/" className="landing-logo">FaceTrack</Link>
          <div className="landing-nav-links">
            <a href="#">Features</a>
            <a href="#">Security</a>
            <a href="#">Institutions</a>
            <a href="#">Pricing</a>
          </div>
          <Link to="/login" className="landing-btn-primary">Get Started</Link>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="landing-hero">
          {/* Background Container with Floating Animation */}
          <div className="landing-hero-bg floating-mesh">
            <div 
              className="landing-hero-bg-image" 
              style={{ backgroundImage: `url(${FaceModelBg})` }}
            >
              <div className="landing-hero-overlay-dark"></div>
              <div className="landing-hero-overlay-gradient"></div>
            </div>
            {/* Scanning Line Overlay */}
            <div className="landing-hero-scan-container">
              <div className="scan-line"></div>
            </div>
            {/* Pulsing Landmark Nodes */}
            <div className="landing-hero-nodes-container">
              <div className="node-pulse" style={{ top: '40%', left: '63%', animationDelay: '0s' }}></div>
              <div className="node-pulse" style={{ top: '43%', left: '72%', animationDelay: '0.5s' }}></div>
              <div className="node-pulse" style={{ top: '55%', left: '62%', animationDelay: '0.2s' }}></div>
              <div className="node-pulse" style={{ top: '68%', left: '65%', animationDelay: '0.8s' }}></div>
              <div className="node-pulse" style={{ top: '43%', left: '58%', animationDelay: '1.2s' }}></div>
              <div className="node-pulse" style={{ top: '58%', left: '75%', animationDelay: '0.4s' }}></div>
            </div>
          </div>

          {/* Content Container */}
          <div className="landing-hero-content-container">
            <div className="landing-hero-content">
              <div className="landing-badge fade-up">
                <span className="landing-badge-dot animate-pulse"></span>
                Next-Generation AI Access
              </div>
              <h1 className="landing-title fade-up fade-up-delay-1">
                Automated AI Attendance for Modern Institutions
              </h1>
              <p className="landing-subtitle fade-up fade-up-delay-2">
                Secure, seamless, and lightning-fast facial recognition for schools and universities. Elevate campus security while streamlining daily operations.
              </p>
              <div className="landing-actions fade-up fade-up-delay-3">
                <Link to="/login" className="landing-btn-primary with-icon">
                  Get Started
                  <span className="material-symbols-outlined icon-filled">arrow_forward</span>
                </Link>
                <a className="landing-btn-secondary" href="#">
                  Learn More
                </a>
              </div>
              <div className="landing-features fade-up fade-up-delay-3">
                <div className="landing-feature-item">
                  <span className="material-symbols-outlined text-gold-light">bolt</span> Fast
                </div>
                <div className="landing-feature-item">
                  <span className="material-symbols-outlined text-gold-light">lock</span> Secure
                </div>
                <div className="landing-feature-item">
                  <span className="material-symbols-outlined text-gold-light">verified</span> Accurate
                </div>
                <div className="landing-feature-item">
                  <span className="material-symbols-outlined text-gold-light">schedule</span> Real-time
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="landing-stats">
          <div className="landing-stats-container">
            <div className="landing-stats-grid">
              <div className="landing-stat-item">
                <div className="landing-stat-value">&lt; 1s</div>
                <div className="landing-stat-label">Matching Speed</div>
              </div>
              <div className="landing-stat-item">
                <div className="landing-stat-value">99.8%</div>
                <div className="landing-stat-label">Accuracy Rate</div>
              </div>
              <div className="landing-stat-item">
                <div className="landing-stat-value">Automated</div>
                <div className="landing-stat-label">Attendance Tracking</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-container">
          <div className="landing-footer-brand">
            <div className="landing-footer-logo">FaceTrack</div>
            <p className="landing-footer-copy">
              © 2024 Team Jarvis. Securing Educational Excellence.
            </p>
          </div>
          <div className="landing-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Security Whitepaper</a>
            <a href="#">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
