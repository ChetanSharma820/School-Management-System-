import React, { useState } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle,
  Sparkles,
  School,
  Info,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { api } from './api';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autofillSuccess, setAutofillSuccess] = useState('');

  const handleAutofill = (role, user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
    setAutofillSuccess(`Loaded ${role} credentials`);
    setTimeout(() => setAutofillSuccess(''), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your username, roll number, or employee ID.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.login({ username: username.trim(), password: password.trim() });
      let user = null;
      if (Array.isArray(res) && res.length > 0) {
        user = res[0];
      } else if (res && res.id) {
        user = res;
      }

      if (user && user.role) {
        onLoginSuccess(user);
      } else {
        setError('Invalid username or password. Please verify your credentials.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* Background ambient lighting and floating glowing orbs */}
      <div className="login-bg-glow glow-top" />
      <div className="login-bg-glow glow-bottom" />
      <div className="login-bg-glow glow-middle" />

      {/* Animated Floating Particles Mesh */}
      <div className="floating-particles-container">
        <div className="floating-particle p1" />
        <div className="floating-particle p2" />
        <div className="floating-particle p3" />
        <div className="floating-particle p4" />
        <div className="floating-particle p5" />
      </div>

      <div className="login-wrapper">
        {/* Left Side: Institutional Banner */}
        <div className="login-hero-card">
          <div className="hero-brand">
            <div className="hero-logo-box">
              <School size={36} color="#38bdf8" />
            </div>
            <div>
              <h1 className="hero-title">Greenwood High</h1>
              <p className="hero-subtitle">Unified Institutional Management Portal</p>
            </div>
          </div>

          <div className="hero-highlight">
            <div className="hero-badge">
              <Sparkles size={14} color="#38bdf8" />
              <span>Role-Based Secure Access Control</span>
            </div>
            <h2 className="hero-heading">
              Personalized Portals for Students, Educators & Administrators
            </h2>
            <p className="hero-desc">
              Experience isolated security scopes with dedicated views for personal fees, report cards, class timetables, teacher salary records, and progress remarks.
            </p>
          </div>

          <div className="portal-features-grid">
            <div className="feature-pill active-student">
              <GraduationCap size={20} color="#38bdf8" />
              <div>
                <strong>Student Access</strong>
                <p>Personal fees & slips, gradebook, attendance & timetables</p>
              </div>
            </div>

            <div className="feature-pill active-teacher">
              <BookOpen size={20} color="#10b981" />
              <div>
                <strong>Teacher Access</strong>
                <p>Biometric punch, student roster, gradebook & salary slips</p>
              </div>
            </div>

            <div className="feature-pill active-admin">
              <ShieldCheck size={20} color="#a855f7" />
              <div>
                <strong>Administrator Access</strong>
                <p>Full institutional control, enrollment, payroll & analytics</p>
              </div>
            </div>
          </div>

          <div className="hero-footer-note">
            <span>Enterprise Security • C++ Microservice Backend • Supabase PostgreSQL</span>
          </div>
        </div>

        {/* Right Side: Clean Unified Single Sign-On Form */}
        <div className="login-card-glass">
          <div className="login-form-header">
            <div className="login-header-badge">
              <KeyRound size={14} color="#38bdf8" />
              <span>EduCore OS • Unified Portal</span>
            </div>
            <h2 className="login-title">Sign In to Your Account</h2>
            <p className="login-subtitle">
              Enter your institutional credentials to access your personalized workspace.
            </p>
          </div>

          {error && (
            <div className="login-error-box">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {autofillSuccess && (
            <div className="login-autofill-banner">
              <CheckCircle2 size={16} color="#10b981" />
              <span>{autofillSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="login-username">
                <User size={15} />
                <span>Username / Roll No / Employee ID</span>
              </label>
              <div className="input-icon-wrapper">
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. aarav.sharma, STU-1001, robert.miller, or admin"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password">
                <Lock size={15} />
                <span>Password</span>
              </label>
              <div className="input-icon-wrapper password-input-wrap">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="login-submit-btn" 
              disabled={loading}
            >
              {loading ? (
                <div className="btn-spinner-wrap">
                  <div className="spinner-dots" />
                  <span>Authenticating Credentials...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to EduCore OS</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Instant Demo Account Autofill Selector */}
            <div className="quick-demo-section">
              <div className="quick-demo-label">
                <span>Quick Demo Accounts</span>
              </div>
              <div className="quick-demo-pills">
                <button
                  type="button"
                  className="demo-pill student-pill"
                  onClick={() => handleAutofill('Student', 'aarav.sharma', 'aarav.sharma@123')}
                  title="Autofill Student credentials"
                >
                  <GraduationCap size={14} />
                  <span>Student (Aarav)</span>
                </button>

                <button
                  type="button"
                  className="demo-pill teacher-pill"
                  onClick={() => handleAutofill('Teacher', 'robert.miller', 'robert.miller@123')}
                  title="Autofill Teacher credentials"
                >
                  <BookOpen size={14} />
                  <span>Faculty (Robert)</span>
                </button>

                <button
                  type="button"
                  className="demo-pill admin-pill"
                  onClick={() => handleAutofill('Admin', 'admin', 'admin123')}
                  title="Autofill Admin credentials"
                >
                  <ShieldCheck size={14} />
                  <span>Master Admin</span>
                </button>
              </div>
            </div>

            <div className="login-security-tip">
              <Info size={14} color="#94a3b8" />
              <span>Default password pattern: <strong>username@123</strong> (Admin: <strong>admin123</strong>)</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
