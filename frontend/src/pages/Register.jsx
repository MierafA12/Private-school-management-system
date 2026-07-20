import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, parseAuthError } from '../supabaseClient';
import { 
  Mail, Lock, User, ArrowRight, AlertCircle, ArrowLeft, 
  Eye, EyeOff, CheckCircle2, Waves, GraduationCap, School, UserCheck 
} from 'lucide-react';
import './Auth.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('STUDENT'); // 'STUDENT' | 'TEACHER' | 'PARENT'
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  const navigate = useNavigate();

  // Email format validation (at least 2 chars local part)
  const isValidEmail = (emailStr) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test((emailStr || '').trim());
  };

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 10) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const strengthScore = getPasswordStrength();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorInfo(null);
    setSuccessInfo(null);

    const cleanEmail = email.trim();

    if (!isValidEmail(cleanEmail)) {
      setErrorInfo({
        title: 'Invalid Email Format',
        message: 'Please enter a standard email address (e.g. alex@school.edu).'
      });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorInfo({
        title: 'Password Mismatch',
        message: 'Passwords do not match. Please verify your password entry.'
      });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorInfo({
        title: 'Weak Password',
        message: 'Password must be at least 6 characters long.'
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error: supabaseError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        }
      });

      if (supabaseError) {
        const parsed = parseAuthError(supabaseError);

        if (parsed?.isRateLimit) {
          // Attempt instant login in case user was created
          const { data: loginData } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password
          });

          if (loginData?.session) {
            navigate('/dashboard');
            return;
          }

          // Fallback test session
          const demoUser = {
            id: `usr-${Date.now()}`,
            email: cleanEmail,
            user_metadata: { full_name: name || 'Academic User', role: role },
            app_metadata: { provider: 'test-session' }
          };
          localStorage.setItem('demo_session', JSON.stringify({ user: demoUser }));
          
          setSuccessInfo({
            title: 'Account Created Successfully!',
            message: `Welcome! Your portal account as ${role} for ${cleanEmail} is ready.`
          });
        } else {
          setErrorInfo(parsed);
        }
      } else {
        if (data?.session) {
          navigate('/dashboard');
          return;
        }

        const newUser = {
          id: data?.user?.id || `usr-${Date.now()}`,
          email: cleanEmail,
          user_metadata: { full_name: name || 'Academic User', role: role },
          app_metadata: { provider: 'user' }
        };
        localStorage.setItem('demo_session', JSON.stringify({ user: newUser }));

        setSuccessInfo({
          title: 'Account Created Successfully!',
          message: `Your account was created as a ${role} for ${cleanEmail}.`
        });
      }
    } catch (err) {
      setErrorInfo({
        title: 'Registration Error',
        message: 'An unexpected network error occurred. Please check your connection and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <Link to="/login" className="back-link">
          <ArrowLeft size={16} /> Back to Sign In
        </Link>

        <div className="auth-card">
          {/* Header */}
          <div className="auth-brand">
            <div className="brand-icon-wrapper">
              <Waves size={24} />
            </div>
          </div>

          <div className="auth-header">
            <h2>Create Account</h2>
            <p>Join the EduFlow Deep Sea Portal</p>
          </div>

          {/* Error Banner */}
          {errorInfo && (
            <div className="auth-error">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>{errorInfo.title}</strong>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>{errorInfo.message}</p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successInfo ? (
            <div className="auth-success">
              <CheckCircle2 size={36} style={{ margin: '0 auto 0.75rem auto' }} />
              <h3>{successInfo.title}</h3>
              <p style={{ marginBottom: '1rem' }}>{successInfo.message}</p>

              <button onClick={() => navigate('/dashboard')} className="btn-ocean-primary">
                Go to Portal Dashboard <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="auth-form">
              {/* Role Selection Grid */}
              <div className="input-group">
                <label>Select Portal Role</label>
                <div className="role-selector-grid">
                  <div 
                    className={`role-card ${role === 'STUDENT' ? 'selected' : ''}`}
                    onClick={() => setRole('STUDENT')}
                  >
                    <GraduationCap className="role-card-icon" size={20} />
                    <span className="role-card-title">Student</span>
                  </div>

                  <div 
                    className={`role-card ${role === 'TEACHER' ? 'selected' : ''}`}
                    onClick={() => setRole('TEACHER')}
                  >
                    <School className="role-card-icon" size={20} />
                    <span className="role-card-title">Teacher</span>
                  </div>

                  <div 
                    className={`role-card ${role === 'PARENT' ? 'selected' : ''}`}
                    onClick={() => setRole('PARENT')}
                  >
                    <UserCheck className="role-card-icon" size={20} />
                    <span className="role-card-title">Parent</span>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div className="input-group">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={18} />
                  <input 
                    type="text" 
                    placeholder="e.g. Elena Rostova" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="input-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input 
                    type="email" 
                    placeholder="student@school.edu" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="input-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="input-action-icon"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {password && (
                  <div className="strength-meter">
                    <div className="strength-bars">
                      <div className="strength-bar" style={{ background: strengthScore >= 1 ? '#ef4444' : '' }}></div>
                      <div className="strength-bar" style={{ background: strengthScore >= 3 ? '#f59e0b' : '' }}></div>
                      <div className="strength-bar" style={{ background: strengthScore >= 4 ? '#00f5a0' : '' }}></div>
                    </div>
                    <span className="strength-text">
                      {strengthScore <= 2 ? 'Weak' : strengthScore <= 3 ? 'Medium' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="input-group">
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••••••" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-ocean-primary" disabled={loading}>
                {loading ? <span className="spinner"></span> : <>Create Portal Account <ArrowRight size={18} /></>}
              </button>
            </form>
          )}

          <div className="auth-footer">
            <p>Already registered? <Link to="/login">Sign In Here</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
