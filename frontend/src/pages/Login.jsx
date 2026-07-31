import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, ArrowLeft, Eye, EyeOff, Waves } from 'lucide-react';
import { useAuth, roleHomePath } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

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

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <Link to="/landing" className="back-link">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div className="auth-card">
          <div className="auth-brand">
            <div className="brand-icon-wrapper"><Waves size={24} /></div>
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
                  placeholder="student@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
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

          <div className="auth-footer">
            <p>Don&apos;t have an account? <Link to="/register">Register</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
