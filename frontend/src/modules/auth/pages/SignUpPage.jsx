import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AuthPages.css';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(event) {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreed) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsLoading(true);

    const apiBase = import.meta.env?.VITE_API_URL || '';

    try {
      const response = await fetch(`${apiBase}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email.trim(),
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError('An account with this email already exists. Please log in instead.');
        } else {
          setError(data.message || 'Signup failed. Please check your information.');
        }
        return;
      }

      // Redirect to login page with clear feedback message
      // Kamyab registration ke baad login safah par feedback message ke sath redirect karein
      navigate('/login', {
        state: { message: 'Account created successfully! Please sign in with your email and password.' }
      });
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

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join over 10,000+ teams managing documents with precision.</p>

        <div className="auth-social-row">
          <button type="button" className="auth-social-button" disabled={isLoading}>Google</button>
          <button type="button" className="auth-social-button" disabled={isLoading}>GitHub</button>
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
                disabled={isLoading}
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
                disabled={isLoading}
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
              disabled={isLoading}
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
            <span className="auth-hint">Must be at least 8 characters.</span>
          </div>

          <div className="auth-field">
            <label>Confirm Password</label>
            <div className="auth-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength={8}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <label className="auth-checkbox-row">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              disabled={isLoading}
            />
            <span>
              I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.
            </span>
          </label>

          {error && (
            <p role="alert" aria-live="assertive" className="auth-error">
              {error}
            </p>
          )}

          <button type="submit" className="auth-submit-button" disabled={isLoading}>
            {isLoading ? 'Signing Up...' : 'Get Started →'}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Log in</Link>
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