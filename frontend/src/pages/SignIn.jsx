/* ==============================================================
   SignIn page — email + password form for existing accounts.
   Redirects to /ask (or the page the user was trying to reach)
   once authentication succeeds.
   ============================================================== */
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import GlbViewer from '../components/GlbViewer.jsx';
import './Auth.css';

/* ---------- inline SVG icons used in the form (mail, lock, eye,
   eye-off for toggling visibility, arrow for the submit button) ---------- */
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3.5 7l8.5 6 8.5-6" />
  </svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2.5" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3l18 18" />
    <path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a17.8 17.8 0 0 1-3.2 4M6.3 7.8A18 18 0 0 0 2 12s3.5 6 10 6a10.5 10.5 0 0 0 4.7-1.1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);
const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="M13 5l7 7-7 7" />
  </svg>
);

export default function SignIn() {
  /* ---------- auth + routing context ---------- */
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // remember where the user was trying to go before being kicked to /sign-in
  const redirectTo = location.state?.from?.pathname || '/ask';

  /* ---------- local form state ---------- */
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // already signed in? skip the form and go straight to the intended page
  if (user) return <Navigate to={redirectTo} replace />;

  /* ---------- derived state + helpers ---------- */
  const canSubmit = form.email.includes('@') && form.password.length >= 6 && !submitting;
  const onChange = key => e => setForm(s => ({ ...s, [key]: e.target.value }));

  /* ---------- submit handler ---------- */
  const onSubmit = async e => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await signIn(form.email.trim(), form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Could not sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      {/* big GriffithAI brand block above the form — 3D model + wordmark */}
      <Link to="/" className="auth-hero">
        <GlbViewer size={140} className="auth-hero-mark auth-hero-mark-3d" />
        <span className="auth-hero-name">GriffithAI</span>
      </Link>

      {/* page title (centered, gradient-clipped, with hairline flankers) */}
      <h1 className="auth-title">Sign in</h1>

      {/* server-side error banner (e.g. wrong credentials) */}
      {error && <div className="auth-error">{error}</div>}

      {/* the actual form — email then password, stacked full-width */}
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <div className="auth-field full">
          <label htmlFor="email">Email</label>
          <div className="auth-input">
            <span className="auth-input-icon"><MailIcon /></span>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@griffith.ie"
              value={form.email}
              onChange={onChange('email')}
              required
            />
          </div>
        </div>

        <div className="auth-field full">
          <label htmlFor="password">Password</label>
          <div className="auth-input">
            <span className="auth-input-icon"><LockIcon /></span>
            <input
              id="password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={onChange('password')}
              required
              minLength={6}
            />
            <button
              type="button"
              className="auth-eye"
              onClick={() => setShowPwd(s => !s)}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
            >
              {showPwd ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {/* submit — red gradient pill with sliding arrow chip */}
        <button type="submit" className="auth-submit" disabled={!canSubmit}>
          <span>{submitting ? 'Signing in…' : 'Sign in'}</span>
          <span className="auth-submit-arrow"><ArrowIcon /></span>
        </button>
      </form>

      {/* cross-link to the sign-up page for new users */}
      <div className="auth-foot">
        New here? <Link to="/sign-up">Create an account</Link>
      </div>
    </div>
  );
}
