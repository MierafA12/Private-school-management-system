import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, ArrowRight, AlertCircle, ArrowLeft,
  Eye, EyeOff, CheckCircle, X,
} from 'lucide-react';
import { useAuth, roleHomePath } from '../../context/AuthContext';
import ThemeToggle from '../../components/shared/ThemeToggle';
import "../../styles/pages/Auth.css";

/* ── Forgot-password states ────────────────────────────────────────────────── */
// 'idle'    — modal not open
// 'form'    — email input shown
// 'loading' — request in flight
// 'sent'    — success confirmation shown

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  // ── Login form ──────────────────────────────────────────────────────────────
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await login({ email: email.trim(), password });
      navigate(roleHomePath(data.user?.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password ─────────────────────────────────────────────────────────
  const [fpState,  setFpState]  = useState('idle');   // idle | form | loading | sent
  const [fpEmail,  setFpEmail]  = useState('');
  const [fpError,  setFpError]  = useState(null);

  const openForgot = () => {
    setFpEmail('');
    setFpError(null);
    setFpState('form');
  };

  const closeForgot = () => setFpState('idle');

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!fpEmail.trim()) {
      setFpError('Please enter your email address.');
      return;
    }
    setFpError(null);
    setFpState('loading');

    try {
      /* When a real email service is wired up, call:
         await api.post('/auth/forgot-password', { email: fpEmail.trim() })
         For now we simulate the round-trip so the UX is complete.           */
      await new Promise(r => setTimeout(r, 1000));
      setFpState('sent');
    } catch {
      setFpError('Something went wrong. Please try again.');
      setFpState('form');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-top-bar">
          <Link to="/landing" className="back-link">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <ThemeToggle />
        </div>

        <div className="auth-card">
          <div className="auth-brand">
            <div className="brand-icon-wrapper">
              <img src="/logo.svg" alt="Haile-Manas Academy" className="auth-brand-logo" />
            </div>
          </div>

          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>Access your secure academic portal</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  placeholder="your.email@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="input-group">
              {/* Label row — password label left, forgot link right */}
              <div className="label-row">
                <label htmlFor="login-password">Password</label>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={openForgot}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-action-icon"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-ocean-primary" disabled={loading}>
              {loading
                ? <span className="spinner" />
                : <><span>Sign In</span> <ArrowRight size={18} /></>
              }
            </button>
          </form>
        </div>
      </div>

      {/* ── Forgot Password Modal ─────────────────────────────────────────── */}
      {fpState !== 'idle' && (
        <div className="fp-overlay" onClick={closeForgot}>
          <div className="fp-modal" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button className="fp-close" onClick={closeForgot} aria-label="Close">
              <X size={18} />
            </button>

            {fpState === 'sent' ? (
              /* ── Success state ── */
              <div className="fp-sent">
                <div className="fp-sent-icon">
                  <CheckCircle size={40} />
                </div>
                <h3>Check your inbox</h3>
                <p>
                  If <strong>{fpEmail}</strong> is registered, you will receive a
                  password reset link shortly. Check your spam folder if you
                  don't see it within a few minutes.
                </p>
                <p className="fp-note">
                  No email access? Contact the school registrar to reset your password directly.
                </p>
                <button className="btn-ocean-primary" onClick={closeForgot}>
                  Back to Sign In
                </button>
              </div>
            ) : (
              /* ── Email form state ── */
              <>
                <div className="fp-header">
                  <h3>Reset your password</h3>
                  <p>Enter the email address linked to your account and we'll send you a reset link.</p>
                </div>

                {fpError && (
                  <div className="auth-error">
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{fpError}</span>
                  </div>
                )}

                <form onSubmit={handleForgot} className="auth-form">
                  <div className="input-group">
                    <label htmlFor="fp-email">Email Address</label>
                    <div className="input-wrapper">
                      <Mail className="input-icon" size={18} />
                      <input
                        id="fp-email"
                        type="email"
                        placeholder="your.email@school.com"
                        value={fpEmail}
                        onChange={(e) => setFpEmail(e.target.value)}
                        required
                        autoFocus
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-ocean-primary"
                    disabled={fpState === 'loading'}
                  >
                    {fpState === 'loading'
                      ? <span className="spinner" />
                      : <><span>Send Reset Link</span> <ArrowRight size={18} /></>
                    }
                  </button>
                </form>

                <p className="fp-note" style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                  Remember your password?{' '}
                  <button
                    type="button"
                    className="forgot-link"
                    onClick={closeForgot}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Back to Sign In
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
