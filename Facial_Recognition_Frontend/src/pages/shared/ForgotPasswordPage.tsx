import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');

  const sendResetCode = async () => {
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (response.ok && result.status === 200) {
        setStep('code');
        setMessage('Reset code sent to your email!');
      } else {
        setMessage(result.message || 'Failed to send reset code');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyResetCode = async () => {
    if (!resetCode || resetCode.length !== 6) {
      setMessage('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode })
      });

      const result = await response.json();

      if (response.ok && result.status === 200) {
        setStep('password');
        setMessage('Code verified! Enter your new password.');
      } else {
        setMessage(result.message || 'Invalid or expired code');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async () => {
    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/update-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode, newPassword })
      });

      const result = await response.json();

      if (response.ok && result.status === 200) {
        setMessage('Password updated successfully! Redirecting...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage(result.message || 'Failed to update password');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'email') {
      sendResetCode();
    } else if (step === 'code') {
      verifyResetCode();
    } else {
      updatePassword();
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'email': return 'Reset Password';
      case 'code': return 'Verify Code';
      case 'password': return 'Set New Password';
    }
  };

  const getDescription = () => {
    switch (step) {
      case 'email': return 'Enter your email to receive a reset code';
      case 'code': return 'Enter the 6-digit code sent to your email';
      case 'password': return 'Enter your new password';
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Processing...';
    switch (step) {
      case 'email': return 'Send Reset Code';
      case 'code': return 'Verify Code';
      case 'password': return 'Update Password';
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-card card">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="back-button"
          >
            ← Back to Login
          </button>

          <div className="forgot-password-header">
            <h1>{getTitle()}</h1>
            <p>{getDescription()}</p>
          </div>

          {message && (
            <div className={`alert ${message.includes('success') || message.includes('verified') || message.includes('sent') ? 'alert-success' : 'alert-error'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="forgot-password-form">
            {step === 'email' && (
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="your.email@example.com"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            {step === 'code' && (
              <div>
                <div className="form-group">
                  <label htmlFor="resetCode" className="form-label">Reset Code</label>
                  <input
                    type="text"
                    id="resetCode"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="form-input code-input"
                    placeholder="000000"
                    maxLength={6}
                    required
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setResetCode('');
                    setMessage('');
                  }}
                  className="btn btn-ghost"
                  style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}
                  disabled={isLoading}
                >
                  Request New Code
                </button>
              </div>
            )}

            {step === 'password' && (
              <>
                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input"
                    placeholder="Min 8 characters"
                    minLength={8}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                    placeholder="Re-enter password"
                    required
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isLoading}
              style={{ width: '100%' }}
            >
              {getButtonText()}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
