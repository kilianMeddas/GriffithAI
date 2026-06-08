/* ==============================================================
   SignUp page — first/last name + email + password form. The
   first account ever created becomes the workspace administrator
   automatically (handled server-side).
   ============================================================== */
import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import GlbViewer from '../components/GlbViewer.jsx';
import './Auth.css';

/* ---------- inline SVG icons used in the form fields and submit ---------- */
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);
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

/* ---------- password strength scorer (0–5)
   adds 1 point each for length ≥ 6, length ≥ 10, an uppercase letter,
   a digit, and a non-alphanumeric symbol — used to drive the visual bar */
function scorePassword(pwd) {
  let s = 0;
  if (pwd.length >= 6)   s += 1;
  if (pwd.length >= 10)  s += 1;
  if (/[A-Z]/.test(pwd)) s += 1;
  if (/[0-9]/.test(pwd)) s += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) s += 1;
  return Math.min(s, 5);
}

export default function SignUp() {
  /* ---------- auth context + router ---------- */
  const { user, signUp } = useAuth();
  const navigate = useNavigate();

  /* ---------- local form state (5 fields + show-pwd toggle + flags) ---------- */
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm: ''
  });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // already signed in? skip the form
  if (user) return <Navigate to="/ask" replace />;

  /* ---------- derived state + helpers ---------- */
  const onChange = key => e => setForm(s => ({ ...s, [key]: e.target.value }));
  const score = useMemo(() => scorePassword(form.password), [form.password]);
  const passwordsMatch = form.password.length > 0 && form.password === form.confirm;

  // every required field must be filled, email must contain @, password ≥ 6,
  // and the confirm field must match before we let the user submit
  const canSubmit =
    form.first_name.trim().length > 0 &&
    form.last_name.trim().length > 0 &&
    form.email.includes('@') &&
    form.password.length >= 6 &&
    passwordsMatch &&
    !submitting;

  /* ---------- submit handler ---------- */
  const onSubmit = async e => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await signUp({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password
      });
      navigate('/ask', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not create account');
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
      <h1 className="auth-title">Create account</h1>

      {/* server-side error banner (e.g. email already taken) */}
      {error && <div className="auth-error">{error}</div>}

      {/* form — first/last name share one row, the rest are full-width */}
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="first">First name</label>
          <div className="auth-input">
            <span className="auth-input-icon"><UserIcon /></span>
            <input
              id="first" type="text" autoComplete="given-name" placeholder="Firstname"
              value={form.first_name} onChange={onChange('first_name')} required
            />
          </div>
        </div>
        <div className="auth-field">
          <label htmlFor="last">Last name</label>
          <div className="auth-input">
            <span className="auth-input-icon"><UserIcon /></span>
            <input
              id="last" type="text" autoComplete="family-name" placeholder="Surname"
              value={form.last_name} onChange={onChange('last_name')} required
            />
          </div>
        </div>

        <div className="auth-field full">
          <label htmlFor="email">Email</label>
          <div className="auth-input">
            <span className="auth-input-icon"><MailIcon /></span>
            <input
              id="email" type="email" autoComplete="email" placeholder="you@griffith.ie"
              value={form.email} onChange={onChange('email')} required
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
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={form.password} onChange={onChange('password')}
              required minLength={6}
            />
            <button
              type="button" className="auth-eye"
              onClick={() => setShowPwd(s => !s)}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
            >
              {showPwd ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {/* live strength bar — width and colour driven by the score */}
          {form.password && (
            <div className="auth-strength" aria-hidden>
              <span className={`s${score}`} style={{ width: `${(score / 5) * 100}%` }} />
            </div>
          )}
        </div>

        <div className="auth-field full">
          <label htmlFor="confirm">Confirm password</label>
          <div className="auth-input">
            <span className="auth-input-icon"><LockIcon /></span>
            <input
              id="confirm"
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={form.confirm} onChange={onChange('confirm')}
              required minLength={6}
            />
          </div>
          {form.confirm && !passwordsMatch && (
            <div className="auth-hint auth-hint-error">Passwords don&apos;t match</div>
          )}
        </div>

        {/* submit — red gradient pill with sliding arrow chip */}
        <button type="submit" className="auth-submit" disabled={!canSubmit}>
          <span>{submitting ? 'Creating account…' : 'Create account'}</span>
          <span className="auth-submit-arrow"><ArrowIcon /></span>
        </button>
      </form>

      {/* cross-link to the sign-in page for returning users */}
      <div className="auth-foot">
        Already a member? <Link to="/sign-in">Sign in</Link>
      </div>
    </div>
  );
}
