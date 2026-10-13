'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Could not sign in. Please try again.');
        return;
      }
      window.location.assign('/');
    } catch {
      setError('Could not reach the sign-in service. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <div className="login-mark" aria-hidden="true"><span>✦</span></div>
          <strong>RS COMPUTER</strong>
        </div>
        <div className="login-heading">
          <h1 id="login-title">WELCOME TO RS COMPUTER</h1>
          <p>Sign in to access your shop dashboard</p>
        </div>
        <div className="login-divider"><span>Sign in with your account</span></div>
        <form onSubmit={submit}>
          <label className="login-field">
            <span>Username</span>
            <input autoComplete="username" name="username" placeholder="Enter your username" value={username} onChange={event => setUsername(event.target.value)} required autoFocus />
          </label>
          <label className="login-field">
            <span>Password</span>
            <span className="password-wrap">
              <input autoComplete="current-password" name="password" placeholder="Enter your password" type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} required />
              <button className="password-toggle" type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 5 8.5 7a8.6 8.6 0 01-2.1 3.1M6.2 6.2C4.5 7.4 3.5 9.1 3.5 12c0 2 3.5 7 8.5 7 1 0 2-.2 2.8-.6" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 12s3.5-7 8.5-7 8.5 7 8.5 7-3.5 7-8.5 7-8.5-7-8.5-7z" /><circle cx="12" cy="12" r="2.5" /></svg>
                )}
              </button>
            </span>
          </label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="login-submit" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Login'}
          </button>
        </form>
        <p className="login-foot">Private access for authorized shop staff</p>
      </section>
      <style jsx>{`
        .login-shell { min-height:100vh; display:grid; place-items:center; padding:24px; color:#191919; background-color:#f8f8f7; background-image:linear-gradient(rgba(30,30,30,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(30,30,30,.035) 1px,transparent 1px); background-size:32px 32px; }
        .login-card { width:min(100%,390px); padding:30px 28px 25px; border:1px solid rgba(0,0,0,.025); border-radius:7px; background:#fff; box-shadow:0 12px 35px rgba(0,0,0,.075); }
        .login-brand { display:flex; flex-direction:column; align-items:center; gap:5px; margin-bottom:15px; color:#414141; }
        .login-mark { width:38px; height:38px; display:grid; place-items:center; color:#c9a26a; font-size:32px; line-height:1; text-shadow:0 1px 4px rgba(180,138,79,.18); }
        .login-mark span { animation:loginFloat 3s ease-in-out infinite; }
        .login-brand strong { font-size:9px; font-weight:700; letter-spacing:1.3px; }
        .login-heading { margin:16px 0 20px; text-align:center; }
        h1 { margin:0; color:#202124; font-size:18px; font-weight:750; letter-spacing:-.45px; }
        .login-heading p { margin:7px auto 0; max-width:245px; color:#858585; font-size:12px; line-height:1.55; }
        .login-divider { display:flex; align-items:center; gap:12px; margin:20px 0 21px; color:#555; font-size:10px; white-space:nowrap; }
        .login-divider::before,.login-divider::after { height:1px; flex:1; background:#e8e8e8; content:''; }
        form { display:grid; gap:14px; }
        .login-field { display:grid; gap:6px; }
        .login-field > span:first-child { color:#555; font-size:12px; font-weight:500; }
        .login-field input { width:100%; height:41px; padding:0 12px; border:1px solid #e2e2e2; border-radius:999px; outline:0; color:#202124; background:#fff; font:inherit; font-size:12px; transition:border-color .16s,box-shadow .16s; }
        .login-field input::placeholder { color:#a0a0a0; }
        .login-field input:focus { border-color:#aaa; box-shadow:0 0 0 3px rgba(0,0,0,.045); }
        .password-wrap { position:relative; display:block; }
        .password-wrap input { padding-right:43px; }
        .password-toggle { position:absolute; top:50%; right:10px; width:24px; height:24px; display:grid; place-items:center; padding:0; transform:translateY(-50%); border:0; color:#333; background:transparent; cursor:pointer; }
        .password-toggle svg { width:16px; height:16px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
        .login-error { margin:0; padding:10px 12px; border-radius:9px; color:#a23f38; background:#fdecea; font-size:12px; }
        .login-submit { height:42px; margin-top:1px; border:0; border-radius:999px; color:#fff; background:#050505; font:inherit; font-size:12px; font-weight:650; cursor:pointer; transition:background .16s,transform .16s; }
        .login-submit:hover:not(:disabled) { transform:translateY(-1px); background:#272727; }
        .login-submit:disabled { cursor:wait; opacity:.72; }
        .login-foot { margin:17px 0 0; color:#8c8c8c; text-align:center; font-size:10px; }
        @keyframes loginEnter { from { opacity:0; transform:translateY(15px); } to { opacity:1; transform:translateY(0); } }
        @keyframes loginFloat { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-3px); } }
        .login-card { animation:loginEnter .55s cubic-bezier(.2,.75,.25,1) both; }
        .login-brand { animation:loginEnter .5s ease .08s both; }
        .login-heading { animation:loginEnter .5s ease .14s both; }
        form { animation:loginEnter .5s ease .2s both; }
        .login-foot { animation:loginEnter .45s ease .28s both; }
        @media(prefers-reduced-motion:reduce) { *,*::before,*::after { animation-duration:.01ms!important; animation-iteration-count:1!important; transition-duration:.01ms!important; } }
        @media(max-width:480px) { .login-card { padding:28px 22px 23px; } }
      `}</style>
    </main>
  );
}
