/**
 * @file LoginPage.jsx
 * @description Authentication login page with credentials form, session redirect, and marketing showcase.
 * Kawaif dakhil karne ka login safah jo kamyab dakhlay par muntakhib shuda ya dashboard safah par redirect karta hai.
 */

import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './AuthPages.css';

/**
 * LoginPage provides user sign-in functionality.
 * Upon successful authentication, redirects to either the previous attempted route
 * preserved in location.state.from or falls back to '/dashboard'.
 *
 * LoginPage sarfeen ko sign in karne ki sahulat faraham karta hai.
 * Kamyab tasdeeq ke baad yeh user ko us page par bhejta hai jahan wo pehle jana chahta tha
 * (location.state.from ke zariye) ya default tor par '/dashboard' par bhej deta hai.
 *
 * @returns {React.ReactElement} The login page view / Login safah ka element.
 */
export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  function handleChange(event) {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  }

  /**
   * Submits user credentials to the authentication API.
   * On success, saves auth token and navigates to the target page.
   *
   * User ke credentials ko authentication API par bhaijta hai.
   * Kamyabi par auth token save karta hai aur matlooba safah par navigate karta hai.
   *
   * @param {React.FormEvent} event
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    const apiBase = import.meta.env?.VITE_API_URL || '';

    try {
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed. Please verify your credentials.');
        return;
      }

      // Save authentication token and user profile object in context and storage
      // Auth token aur user profile data ko AuthContext aur localStorage mein mehfooz karein
      login(data.user, data.token);

      // Notify other active components about profile update
      // Dusre active components ko user profile update ki itlaa dein
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: data.user }));

      const redirectPath = location.state?.from?.pathname || '/dashboard';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
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
              disabled={isLoading}
            />
          </div>

          <div className="auth-field">
            <div className="auth-field-label-row">
              <label>Password</label>
              <Link to="/forgot-password" className="auth-inline-link">Forgot password?</Link>
            </div>
            <div className="auth-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
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
              disabled={isLoading}
            />
            <span>Keep me signed in for 30 days</span>
          </label>

          {location.state?.message && !error && (
            <p className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs sm:text-sm font-medium text-emerald-800">
              ✓ {location.state.message}
            </p>
          )}

          {error && (
            <p role="alert" aria-live="assertive" className="auth-error">
              {error}
            </p>
          )}

          <button type="submit" className="auth-submit-button" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In →'}
          </button>
        </form>

        <div className="auth-divider">OR CONTINUE WITH</div>

        <div className="auth-social-row">
          <button type="button" className="auth-social-button" disabled={isLoading}>Google</button>
          <button type="button" className="auth-social-button" disabled={isLoading}>GitHub</button>
        </div>

        <p className="auth-footer-text">
          Don't have an account? <Link to="/signup">Create an account</Link>
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