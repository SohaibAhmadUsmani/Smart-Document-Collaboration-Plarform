/**
 * @file ForgotPasswordPage.jsx
 * @description Password recovery request page for initiating reset link emails.
 * Password recovery ka safah jo reset link email bhejne ki darkhwast ke liye istemal hota hai.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import './AuthPages.css';

/**
 * ForgotPasswordPage allows users to request a password reset email.
 * Includes client feedback state and accessible navigation links back to login.
 *
 * ForgotPasswordPage sarfeen ko password reset karne ka link hasil karne ki sahulat deta hai.
 * Is mein request bhejne ke baad confirmation pegham aur login par wapis jane ka Link shaamil hai.
 *
 * @returns {React.ReactElement}
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  /**
   * Submits email for password reset request.
   * Password reset ke liye email submit karta hai.
   *
   * @param {React.FormEvent} event
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const apiBase = import.meta.env?.VITE_API_URL || '';

    try {
      const response = await fetch(`${apiBase}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Something went wrong');
        return;
      }

      setSubmitted(true);
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

        <h1 className="auth-title">Reset your password</h1>
        <p className="auth-subtitle">
          Enter your email and we'll send you a link to reset your password.
        </p>

        {submitted ? (
          <p className="auth-footer-text" style={{ marginTop: 24 }}>
            If an account with that email exists, a reset link has been sent. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="name@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit-button">
              Send reset link →
            </button>
          </form>
        )}

        <p className="auth-footer-text">
          Remembered your password? <Link to="/login">Log in</Link>
        </p>
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