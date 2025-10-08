import React, { useState, useEffect } from 'react';
import '../styles/pages/AuthToggle.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
// Registration now directly assigns chosen role; no pending workflow on register.
import { auth } from '../firebase.js';

// Admin role is not self-assignable via registration.
const selectableRoles = ['student','recruiter'];

export default function AuthPage() {
  const { user, role, requestedRole, loginWithGoogle, registerEmail, loginEmail, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email:'', password:'', confirm:'', regRole:'student' });
  const [reqRole, setReqRole] = useState('recruiter');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [reqMsg, setReqMsg] = useState(null);

  useEffect(()=>{ 
    // Only auto-redirect if no pending requestedRole OR user already has elevated role.
    if(user) navigate(`/dashboard/${role}`, { replace:true });
  }, [user, role, navigate, requestedRole]);

  function validate() {
    const e = {};
    if(!form.email) e.email='Email required';
    if(!form.password) e.password='Password required';
    if(mode==='register') {
      if(!form.confirm) e.confirm='Confirm password';
      if(!e.password && form.password !== form.confirm) e.confirm='Passwords do not match';
      if(form.password && form.password.length<6) e.password='Min 6 chars';
      if(!form.regRole) e.regRole='Role required';
    }
    setErrors(e); return Object.keys(e).length===0;
  }
  function setField(k){ return ev=> setForm(f=>({...f,[k]:ev.target.value})); }

  async function handleSubmit(e){
    e.preventDefault();
    if(!validate()) return;
    setSubmitting(true);
    if(mode==='login') {
      const res = await loginEmail(form.email.trim(), form.password.trim());
      if(!res.ok) setErrors(prev=>({...prev, form: res.error }));
      setSubmitting(false);
      return;
    }
    // register
  const res = await registerEmail(form.email.trim(), form.password.trim(), form.regRole);
    if(!res.ok) {
      setErrors(prev=>({...prev, form: res.error }));
      setSubmitting(false);
      return;
    }
    // If selected role is not student, request it
    // Direct role assignment already handled inside registerEmail; nothing else needed.
    setSubmitting(false);
  }

  async function handleRoleRequest(e){
    e.preventDefault();
    if(!user) return;
    setRequesting(true); setReqMsg(null);
    try { await requestRoleChange(user.uid, reqRole, reason.trim()); setReqMsg('Role request submitted. Await approval.'); }
    catch(err){ setReqMsg('Failed: '+err.message); }
    finally { setRequesting(false); }
  }

  return (
    <div className="auth-layout" aria-label="Authentication page">
      <div className="auth-side marketing" aria-hidden="true">
        <div className="inner marketing-inner pt-6vh pb-6vh">
          <div className="maxw-520">
            <h1 className="marketing-headline"><span className="gradient-accent">Hire better.</span><br /><span className="headline-fade">Faster.</span></h1>
            <p className="lead">Unified campus recruitment with real-time data.</p>
            <ul className="feature-list">
              <li>Google or Email/Password</li>
              <li>Role request workflow</li>
              <li>Extensible architecture</li>
            </ul>
          </div>
          <div className="mt-auto fs-xs opacity-75 ls-1">© {new Date().getFullYear()} HireLedger</div>
        </div>
        <div aria-hidden className="decor-layer"><div className="decor-a" /><div className="decor-b" /></div>
      </div>
      <div className="auth-side form">
        {!user && (
          <form className="auth-card glass" onSubmit={handleSubmit} noValidate>
            <div className="auth-mode-toggle" role="tablist" aria-label="Auth mode">
              <button type="button" role="tab" aria-selected={mode==='login'} className={mode==='login'?'seg-btn active':'seg-btn'} onClick={()=>setMode('login')}>Login</button>
              <button type="button" role="tab" aria-selected={mode==='register'} className={mode==='register'?'seg-btn active':'seg-btn'} onClick={()=>setMode('register')}>Register</button>
              <span className="seg-highlight" data-mode={mode} />
            </div>
            <h2 className="auth-welcome">{mode==='login'?'Welcome back':'Create Account'}</h2>
            {errors.form && <div className="error-msg" role="alert">{errors.form}</div>}
            <label className="field-group">Email<input type="email" value={form.email} onChange={setField('email')} aria-invalid={!!errors.email} />{errors.email && <small className="error-msg">{errors.email}</small>}</label>
            <label className="field-group">Password<input type="password" value={form.password} onChange={setField('password')} aria-invalid={!!errors.password} />{errors.password && <small className="error-msg">{errors.password}</small>}</label>
            {mode==='register' && <label className="field-group">Confirm<input type="password" value={form.confirm} onChange={setField('confirm')} aria-invalid={!!errors.confirm} />{errors.confirm && <small className="error-msg">{errors.confirm}</small>}</label>}
            {mode==='register' && <label className="field-group">Role
              <select value={form.regRole} onChange={setField('regRole')} aria-invalid={!!errors.regRole}>
                {selectableRoles.map(r=> <option key={r}>{r}</option>)}
              </select>
              {errors.regRole && <small className="error-msg">{errors.regRole}</small>}
            </label>}
            <div className="actions-row actions-tight">
              <button type="submit" className="btn primary" disabled={submitting || loading}>{submitting ? (mode==='login'?'Logging in…':'Registering…') : (mode==='login'?'Login':'Register')}</button>
              <button type="button" className="link-btn" onClick={()=>alert('Password reset flow TBD')}>Forgot Password</button>
            </div>
            <div className="divider-row" aria-hidden="true"><span>or</span></div>
            <button type="button" className="btn secondary full" onClick={async()=>{ const res = await loginWithGoogle(); if(res.ok) navigate(`/dashboard/${role}`, { replace:true }); }} disabled={loading}>Continue with Google</button>
          </form>
        )}
        {user && (
          <div className="auth-card glass" role="region" aria-label="Role request">
            <h2 className="auth-welcome">Current Role: {role}</h2>
            {requestedRole && <p className="muted small">Requested role pending: {requestedRole}</p>}
            {!requestedRole && role !== 'admin' && (
              <form onSubmit={handleRoleRequest} className="role-request-form">
                <label className="field-group">Request Role
                  <select value={reqRole} onChange={e=>setReqRole(e.target.value)}>
                    {selectableRoles.filter(r=> r!==role).map(r=> <option key={r}>{r}</option>)}
                  </select>
                </label>
                <button type="submit" className="btn primary" disabled={requesting}>{requesting?'Submitting…':'Submit Request'}</button>
              </form>
            )}
            {reqMsg && <div className="status-msg info" role="status">{reqMsg}</div>}
            <button className="btn ghost mt-2" onClick={()=>navigate(`/dashboard/${role}`)}>Go to Dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
}
