import { useState } from 'react';
import './AuthPages.css';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function handleChange(event) {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!agreed) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Signup failed');
        return;
      }

      window.location.href = '/login';
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

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join over 10,000+ teams managing documents with precision.</p>

        <div className="auth-social-row">
          <button type="button" className="auth-social-button">Google</button>
          <button type="button" className="auth-social-button">GitHub</button>
        </div>

        <div className="auth-divider">OR CONTINUE WITH EMAIL</div>

        <form onSubmit={handleSubmit}>
          <div className="auth-form-row">
            <div className="auth-field">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                placeholder="Jane"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="auth-field">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Work Email</label>
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
            <label>Password</label>
            <div className="auth-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                minLength={8}
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
            <span className="auth-hint">Must be at least 8 characters.</span>
          </div>

          <label className="auth-checkbox-row">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
            />
            <span>
              I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
            </span>
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit-button">
            Get Started →
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>

      <div className="auth-panel-right">
        <div className="auth-promo-card">
          <span className="auth-badge">ENTERPRISE READY</span>
          <h2>The standard for modern team sync.</h2>
          <p>Experience seamless workflows with integrated version control and real-time collaboration tools built for scale.</p>
          <ul className="auth-feature-list">
            <li>✓ Real-time document collaboration</li>
            <li>✓ Smart version control &amp; history</li>
            <li>✓ Advanced team permissions</li>
            <li>✓ 256-bit enterprise encryption</li>
          </ul>
        </div>
      </div>
    </div>
  );
}