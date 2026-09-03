import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './AuthPages.css';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    fetch(`/api/auth/verify-email/${token}`)
      .then((response) => {
        if (response.ok) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-panel-left">
        <div className="auth-brand">
          <span className="auth-brand-icon">📄</span>
          <span className="auth-brand-name">DocSync Pro</span>
        </div>

        {status === 'verifying' && <h1 className="auth-title">Verifying your email...</h1>}

        {status === 'success' && (
          <>
            <h1 className="auth-title">Email verified!</h1>
            <p className="auth-subtitle">Your account is now verified. You can log in.</p>
            <Link to="/login" className="auth-submit-button" style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}>
              Go to login →
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="auth-title">Verification failed</h1>
            <p className="auth-subtitle">This link may be invalid or expired.</p>
            <Link to="/signup" className="auth-footer-text">Back to sign up</Link>
          </>
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