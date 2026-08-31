import { useState } from 'react';
import './AuthPages.css';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function handleChange(event) {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard';
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

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Please enter your details to access your workspace.</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <div className="auth-field-label-row">
              <label>Password</label>
              <a href="/forgot-password" className="auth-inline-link">Forgot password?</a>
            </div>
            <div className="auth-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <label className="auth-checkbox-row">
            <input
              type="checkbox"
              checked={keepSignedIn}
              onChange={(event) => setKeepSignedIn(event.target.checked)}
            />
            <span>Keep me signed in for 30 days</span>
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit-button">
            Sign In →
          </button>
        </form>

        <div className="auth-divider">OR CONTINUE WITH</div>

        <div className="auth-social-row">
          <button type="button" className="auth-social-button">Google</button>
          <button type="button" className="auth-social-button">GitHub</button>
        </div>

        <p className="auth-footer-text">
          Don't have an account? <a href="/signup">Create an account</a>
        </p>

        <p className="auth-security-note">
          🔒 Secure enterprise-grade encryption. Your data is strictly managed according to DocSync Pro standards.
        </p>
      </div>

      <div className="auth-panel-right">
        <div className="auth-promo-card auth-promo-card--login">
          <span className="auth-badge">● NEW VERSION 4.2</span>
          <h2>Real-time sync, everywhere</h2>
          <p>Seamlessly collaborate with your team in a workspace designed for precision and high-performance document management.</p>
          <div className="auth-stats-row">
            <div>
              <strong>10k+</strong>
              <span>Teams Onboarded</span>
            </div>
            <div>
              <strong>99.9%</strong>
              <span>Sync Uptime</span>
            </div>
            <div>
              <strong>ISO</strong>
              <span>27001 Certified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}