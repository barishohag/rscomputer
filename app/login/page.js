'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
          <div className="login-mark" aria-hidden="true">RS</div>
          <div><strong>RS Computer</strong><span>Point of sale workspace</span></div>
        </div>
        <div className="login-heading">
          <p className="login-eyebrow">ADMIN ACCESS</p>
          <h1 id="login-title">Welcome back</h1>
          <p>Sign in to open your shop dashboard.</p>
        </div>
        <form onSubmit={submit}>
          <label className="login-field">
            <span>Username</span>
            <input autoComplete="username" name="username" value={username} onChange={event => setUsername(event.target.value)} required autoFocus />
          </label>
          <label className="login-field">
            <span>Password</span>
            <input autoComplete="current-password" name="password" type="password" value={password} onChange={event => setPassword(event.target.value)} required />
          </label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="login-submit" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'} <span aria-hidden="true">→</span>
          </button>
        </form>
        <p className="login-foot">Private access for authorized shop staff</p>
      </section>
      <style jsx>{`
        .login-shell { min-height:100vh; display:grid; place-items:center; padding:24px; color:#17211e; background:radial-gradient(ellipse at 50% 0%,#e7f1e9 0%,#f4f6f2 50%,#f4f6f2 100%); }
        .login-card { width:min(100%,430px); padding:38px; border:1px solid #e5ebe6; border-radius:20px; background:#fff; box-shadow:0 24px 70px rgba(23,33,30,.09); }
        .login-brand { display:flex; align-items:center; gap:12px; }
        .login-mark { width:42px; height:42px; display:grid; place-items:center; border-radius:13px; background:#1a6b4a; color:#fff; font-size:14px; font-weight:800; letter-spacing:-.5px; }
        .login-brand strong,.login-brand span { display:block; }
        .login-brand strong { font-size:15px; letter-spacing:-.2px; }
        .login-brand span { margin-top:3px; color:#7a8580; font-size:11px; }
        .login-heading { margin:39px 0 25px; }
        .login-eyebrow { margin:0 0 8px; color:#1a6b4a; font-size:10px; font-weight:800; letter-spacing:1.3px; }
        h1 { margin:0; font-size:28px; letter-spacing:-1px; }
        .login-heading > p:last-child { margin:7px 0 0; color:#7a8580; font-size:13px; }
        form { display:grid; gap:16px; }
        .login-field { display:grid; gap:7px; }
        .login-field span { color:#58645e; font-size:11px; font-weight:700; }
        .login-field input { width:100%; height:45px; padding:0 12px; border:1px solid #dfe6e0; border-radius:9px; outline:0; color:#17211e; background:#fff; font:inherit; font-size:13px; transition:border-color .15s,box-shadow .15s; }
        .login-field input:focus { border-color:#74a487; box-shadow:0 0 0 3px rgba(26,107,74,.1); }
        .login-error { margin:0; padding:10px 12px; border-radius:8px; color:#a23f38; background:#fdecea; font-size:12px; }
        .login-submit { height:46px; display:flex; align-items:center; justify-content:center; gap:10px; border:0; border-radius:9px; color:#fff; background:#1a6b4a; font:inherit; font-size:13px; font-weight:750; cursor:pointer; transition:background .15s,transform .15s; }
        .login-submit:hover:not(:disabled) { background:#15583e; transform:translateY(-1px); }
        .login-submit:disabled { cursor:wait; opacity:.75; }
        .login-submit span { font-size:17px; }
        .login-foot { margin:22px 0 0; color:#98a19c; text-align:center; font-size:10px; }
        @media(max-width:480px) { .login-card { padding:28px 22px; } }
      `}</style>
    </main>
  );
}
