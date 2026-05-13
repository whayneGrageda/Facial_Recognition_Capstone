import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Shield, BarChart3 } from 'lucide-react';
import FaceModelBg from '../../assets/Face_model.png';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page dark">
      {/* Nav */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <Link to="/" className="lp-logo">
            <span className="lp-logo-icon">◎</span>
            FACE TRACK
          </Link>
          <ul className="lp-nav-links">
            <li><a href="#features">Protocol</a></li>
            <li><a href="#stats">Intel</a></li>
            <li><a href="#footer">Systems</a></li>
          </ul>
          <Link to="/login" className="lp-nav-cta">Deploy Now</Link>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="lp-hero">
          {/* Face model as background */}
          <div className="lp-hero-bg">
            <div className="lp-face-wrapper">
              <img src={FaceModelBg} alt="" className="lp-hero-bg-img" />
              {/* Pulsing nodes positioned relative to the face image */}
              <div className="lp-node" style={{ bottom: '52%', right: '38%', animationDelay: '0s' }} />
              <div className="lp-node" style={{ bottom: '44%', right: '28%', animationDelay: '0.5s' }} />
              <div className="lp-node" style={{ bottom: '45%', right: '40%', animationDelay: '0.2s' }} />
              <div className="lp-node" style={{ bottom: '35%', right: '35%', animationDelay: '0.8s' }} />
              <div className="lp-node" style={{ bottom: '55%', right: '45%', animationDelay: '1.2s' }} />
              <div className="lp-node" style={{ bottom: '40%', right: '25%', animationDelay: '0.4s' }} />
            </div>
            <div className="lp-hero-bg-overlay" />
          </div>
          {/* Grid background */}
          <div className="lp-hero-grid" />
          {/* Glows */}
          <div className="lp-glow lp-glow-gold" />
          <div className="lp-glow lp-glow-brown" />

          {/* Content — left aligned over the background */}
          <div className="lp-hero-content">
            <div className="lp-eyebrow">
              <span className="lp-live-dot" />
              Threat Detection Active
            </div>

            <h1 className="lp-title">
              <span className="lp-title-gold">Zero Breach.</span><br />
              <span className="lp-title-gold">Zero</span><br />
              <span className="lp-title-gold">Compromise.</span>
            </h1>

            <p className="lp-sub">
              FaceTrack is a <strong>military-grade facial recognition security platform</strong> — identifying threats, verifying clearances, and logging every entry in real time. No blind spots. No exceptions.
            </p>

            <div className="lp-cta-row">
              <Link to="/login" className="lp-btn-primary">Deploy System</Link>
              <a href="#features" className="lp-btn-ghost">View Intel</a>
            </div>

            <div className="lp-status-row">
              <span className="lp-status-item">
                <span className="lp-status-dot">•</span> SOC 2 Type II Certified
              </span>
              <span className="lp-status-item">
                <span className="lp-status-dot">•</span> 256-bit AES Encrypted
              </span>
              <span className="lp-status-item">
                <span className="lp-status-dot">•</span> 99.97% Accuracy
              </span>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="lp-stats" id="stats">
          <div className="lp-stats-grid">
            <div className="lp-stat">
              <div className="lp-stat-value">&lt; 1s</div>
              <div className="lp-stat-label">Matching Speed</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat-value">99.8%</div>
              <div className="lp-stat-label">Accuracy Rate</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat-value">Automated</div>
              <div className="lp-stat-label">Attendance Tracking</div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="lp-features" id="features">
          <div className="lp-features-grid">
            <div className="lp-feature-card">
              <div className="lp-feature-icon"><Zap size={24} /></div>
              <h3>Real-Time Detection</h3>
              <p>Sub-second facial recognition with live threat assessment and instant access control.</p>
            </div>
            <div className="lp-feature-card">
              <div className="lp-feature-icon"><Shield size={24} /></div>
              <h3>Anti-Spoofing AI</h3>
              <p>Advanced liveness detection blocks printed photos, screen replays, and deepfake attempts.</p>
            </div>
            <div className="lp-feature-card">
              <div className="lp-feature-icon"><BarChart3 size={24} /></div>
              <h3>Smart Analytics</h3>
              <p>AI-powered attendance insights, anomaly detection, and automated reporting.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="lp-footer" id="footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-footer-logo">FaceTrack</span>
            <p>© 2024 Team Jarvis. Securing Educational Excellence.</p>
          </div>
          <div className="lp-footer-links">
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
