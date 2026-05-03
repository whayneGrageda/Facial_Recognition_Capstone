import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getErrorMessage } from '../../utils/errorHandler';
import { Eye, EyeOff } from 'lucide-react';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const roleRoutes: Record<string, string> = {
        admin: '/admin',
        moderator: '/moderator',
        student: '/user/dashboard',
        faculty: '/user/dashboard',
      };
      navigate(roleRoutes[user.role] || '/login', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email: formData.email, password: formData.password });
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="login-page">
      {/* Background Elements */}
      <div className="login-background">
        <div className="gradient-overlay"></div>
        <div className="grid-pattern"></div>
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="radial-glow glow-1"></div>
        <div className="radial-glow glow-2"></div>
      </div>

      {/* Left Side - Branding */}
      <div className="login-left">
        <div className="brand-content">
          <div className="logo-header">
            <div className="logo-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="20" stroke="#C9A84C" strokeWidth="2"/>
                <circle cx="24" cy="18" r="6" fill="#C9A84C"/>
                <path d="M12 38C12 32 16 28 24 28C32 28 36 32 36 38" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="brand-title">FaceTrack</h1>
          </div>
          
          <h2 className="main-heading">
            <span className="heading-line">Intelligent</span>
            <span className="heading-line">Attendance</span>
            <span className="heading-line heading-highlight">Management</span>
          </h2>
          
          <p className="brand-subtitle">
            Facial recognition-powered attendance tracking for modern institutions.
          </p>

          <div className="feature-cards">
            <div className="feature-card">
              <div className="feature-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="#C9A84C"/>
                </svg>
              </div>
              <div className="feature-card-content">
                <h3>Real-time Recognition</h3>
                <p>Sub-second facial identification</p>
              </div>
              <span className="feature-value">{'< 300ms'}</span>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#C9A84C" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="6" stroke="#C9A84C" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="2" fill="#C9A84C"/>
                </svg>
              </div>
              <div className="feature-card-content">
                <h3>High Accuracy</h3>
                <p>Industry-grade precision model</p>
              </div>
              <span className="feature-value">99.8%</span>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z" stroke="#C9A84C" strokeWidth="2" fill="none"/>
                  <path d="M9 12l2 2 4-4" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="feature-card-content">
                <h3>Encrypted & Secure</h3>
                <p>AES-256 end-to-end encryption</p>
              </div>
              <span className="feature-value">AES-256</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your account</p>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-login"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <span className="btn-shine"></span>
                  Sign In
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="forgot-password-link"
            >
              Forgot Password?
            </button>

            <div className="divider">
              <span>Don't have an account?</span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/register')}
              className="btn btn-secondary btn-register"
            >
              Create Account
            </button>
          </form>

          <div className="login-footer">
            <p>© 2024 Team Jarvis. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
