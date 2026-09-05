import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AuthPages.css';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    const apiBase = import.meta.env?.VITE_API_URL || '';

    try {
      const response = await fetch(`${apiBase}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to reset password');
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel-left">
        <div className="auth-brand">
          <span className="auth-brand-icon">📄</span>
          <span className="auth-brand-name">DocSync Pro</span>
        </div>

        <h1 className="auth-title">Set a new password</h1>
        <p className="auth-subtitle">Choose a strong password you haven't used before.</p>

        {success ? (
          <p className="auth-footer-text" style={{ marginTop: 24 }}>
            Password reset successfully! Redirecting you to login...
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
              <span className="auth-hint">Must be at least 8 characters.</span>
            </div>

            <div className="auth-field">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit-button">
              Reset password →
            </button>
          </form>
        )}
      </div>

      <div className="auth-panel-right">
        <div className="auth-promo-card">
          <span className="auth-badge">ENTERPRISE READY</span>
          <h2>The standard for modern team sync.</h2>
          <p>Experience seamless workflows with integrated version control and real-time collaboration tools built for scale.</p>
        </div>
      </div>
    </div>
  );
}