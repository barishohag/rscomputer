'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
let authClient;

function getAuthClient() {
  if (!supabaseUrl || !supabaseKey) return null;
  if (!authClient) {
    authClient = createClient(supabaseUrl, supabaseKey, {
      auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true },
    });
  }
  return authClient;
}

export default function LoginPage() {
  const [mode, setMode] = useState('admin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const completeProviderLogin = useCallback(async accessToken => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/login/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Could not complete sign in. Please try again.');
        return;
      }
      window.location.assign('/');
    } catch {
      setError('Could not reach the sign-in service. Please try again.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callback = params.has('oauth') || params.has('code') || window.location.hash.includes('access_token');
    if (!callback) return;

    const oauthError = params.get('error_description') || params.get('error');
    if (oauthError) {
      setError(decodeURIComponent(oauthError.replace(/\+/g, ' ')));
      return;
    }

    const client = getAuthClient();
    if (!client) {
      setError('Google sign in is not configured yet.');
      return;
    }
    let active = true;
    client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      else if (data.session?.access_token) completeProviderLogin(data.session.access_token);
      else setError('Sign in did not finish. Please try again.');
    });
    return () => { active = false; };
  }, [completeProviderLogin]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (mode === 'admin') {
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
        return;
      }

      const client = getAuthClient();
      if (!client) {
        setError('Account sign in is not configured yet. The site owner needs to connect Supabase Auth.');
        return;
      }

      if (mode === 'register') {
        const { data, error: authError } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin + '/login' },
        });
        if (authError) {
          setError(authError.message);
          return;
        }
        if (data.session?.access_token) {
          await completeProviderLogin(data.session.access_token);
        } else {
          setNotice('Account created. Check your email to confirm it, then return here to sign in.');
          setMode('login');
        }
        return;
      }

      const { data, error: authError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      if (data.session?.access_token) await completeProviderLogin(data.session.access_token);
      else setError('Sign in did not return an active session. Please try again.');
    } catch {
      setError('Could not reach the sign-in service. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function continueWithGoogle() {
    setError('');
    setNotice('');
    const client = getAuthClient();
    if (!client) {
      setError('Google sign in is not configured yet. The site owner needs to connect Supabase and Google OAuth.');
      return;
    }
    setBusy(true);
    const { error: authError } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/login?oauth=google' },
    });
    if (authError) {
      setError(authError.message);
      setBusy(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError('');
    setNotice('');
    setPassword('');
  }

  const isAdmin = mode === 'admin';
  const isRegister = mode === 'register';

  return (
    <main className="login-shell">
      <div className="ambient-orb orb-one" aria-hidden="true" />
      <div className="ambient-orb orb-two" aria-hidden="true" />
      <div className="ambient-orb orb-three" aria-hidden="true" />
      <div className="login-scene">
        <aside className="glass-widget welcome-widget" aria-hidden="true">
          <div className="widget-kicker"><span>✦</span> RS COMPUTER</div>
          <div className="widget-title">Shop workspace</div>
          <div className="widget-copy">Sales, memos and payments</div>
        </aside>
        <aside className="glass-widget secure-widget" aria-hidden="true">
          <div className="secure-mark">✓</div>
          <div><div className="widget-title">Staff access</div><div className="widget-copy">Private shop workspace</div></div>
        </aside>
        <aside className="glass-widget activity-widget" aria-hidden="true">
          <div className="widget-title">Ready for business</div>
          <div className="widget-copy">Your register, one place</div>
          <div className="decorative-bars"><i /><i /><i /><i /><i /><i /></div>
        </aside>
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <div className="login-mark" aria-hidden="true"><span>✦</span></div>
          <strong>RS COMPUTER</strong>
        </div>
        <div className="login-heading">
          <h1 id="login-title">{isRegister ? 'CREATE YOUR ACCOUNT' : 'WELCOME TO RS COMPUTER'}</h1>
          <p>{isRegister ? 'Register to request shop dashboard access' : 'Sign in to access your shop dashboard'}</p>
        </div>

        <button className="google-button" type="button" onClick={continueWithGoogle} disabled={busy}>
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.72 7.18l7.62 5.91c4.45-4.1 7.14-10.15 7.14-17.56z" />
            <path fill="#FBBC05" d="M10.54 28.59a14.4 14.4 0 010-9.18l-7.98-6.19a23.94 23.94 0 000 21.56l7.98-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.89l-7.62-5.91c-2.12 1.42-4.83 2.27-8.28 2.27-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Continue with Google
        </button>
        <div className="login-divider"><span>or use your account</span></div>

        <form onSubmit={submit}>
          {isAdmin ? (
            <label className="login-field">
              <span>Username</span>
              <input autoComplete="username" name="username" placeholder="Enter your username" value={username} onChange={event => setUsername(event.target.value)} required autoFocus />
            </label>
          ) : (
            <label className="login-field">
              <span>Email</span>
              <input autoComplete="email" name="email" type="email" placeholder="Enter your email" value={email} onChange={event => setEmail(event.target.value)} required autoFocus />
            </label>
          )}
          <label className="login-field">
            <span>Password</span>
            <span className="password-wrap">
              <input autoComplete={isRegister ? 'new-password' : 'current-password'} name="password" placeholder={isRegister ? 'Create a password (8+ characters)' : 'Enter your password'} minLength={isRegister ? 8 : undefined} type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} required />
              <button className="password-toggle" type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 5 8.5 7a8.6 8.6 0 01-2.1 3.1M6.2 6.2C4.5 7.4 3.5 9.1 3.5 12c0 2 3.5 7 8.5 7 1 0 2-.2 2.8-.6" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 12s3.5-7 8.5-7 8.5 7 8.5 7-3.5 7-8.5 7-8.5-7-8.5-7z" /><circle cx="12" cy="12" r="2.5" /></svg>
                )}
              </button>
            </span>
          </label>
          {notice && <p className="login-notice" role="status">{notice}</p>}
          {error && <p className="login-error" role="alert">{error}</p>}
          {isRegister && <p className="access-note">New accounts need admin approval before they can open the dashboard.</p>}
          <button className="login-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Login'}
          </button>
        </form>

        <div className="login-options">
          {isAdmin ? (
            <button type="button" onClick={() => changeMode('register')}>Register a new account</button>
          ) : (
            <>
              <button type="button" onClick={() => changeMode(isRegister ? 'login' : 'register')}>
                {isRegister ? 'Already registered? Sign in' : 'Create a new account'}
              </button>
              <button type="button" onClick={() => changeMode('admin')}>Use admin username</button>
            </>
          )}
        </div>
        <p className="login-foot">Private access for authorized shop staff</p>
      </section>
      </div>
      <style jsx>{`
.login-shell { position:relative; min-height:100vh; min-height:100svh; display:grid; place-items:center; padding:32px 24px; overflow:hidden; isolation:isolate; color:#17211e; background:linear-gradient(135deg,#e9f5fb 0%,#f7f7f7 48%,#e6f6f0 100%); }
        .login-shell::before { position:absolute; inset:0; z-index:-1; background-image:linear-gradient(rgba(255,255,255,.45) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.45) 1px,transparent 1px); background-size:38px 38px; content:''; mask-image:linear-gradient(to bottom,transparent,#000 18%,#000 88%,transparent); }
        .ambient-orb { position:absolute; z-index:-1; pointer-events:none; border-radius:50%; filter:blur(55px); opacity:.72; }
        .orb-one { width:340px; height:340px; top:-115px; left:-100px; background:rgba(56,189,248,.32); animation:orbDrift 13s ease-in-out infinite alternate; }
        .orb-two { width:330px; height:330px; right:-100px; bottom:-95px; background:rgba(52,211,153,.24); animation:orbDrift 16s ease-in-out infinite alternate-reverse; }
        .orb-three { width:190px; height:190px; top:15%; right:17%; background:rgba(250,204,21,.17); animation:orbDrift 12s ease-in-out infinite alternate; }
        .login-scene { position:relative; width:min(1080px,100%); min-height:min(760px,calc(100svh - 40px)); display:grid; place-items:center; }
        .glass-widget { position:absolute; z-index:1; border:1px solid rgba(255,255,255,.82); border-radius:17px; background:rgba(255,255,255,.56); box-shadow:0 18px 48px rgba(31,60,69,.09),inset 0 1px 0 rgba(255,255,255,.7); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); }
        .welcome-widget { top:13%; left:1%; width:234px; padding:20px 22px; animation:floatAlt 6.4s ease-in-out infinite; }
        .widget-kicker { display:flex; align-items:center; gap:8px; margin-bottom:13px; color:#54726f; font-size:10px; font-weight:750; letter-spacing:1.2px; }
        .widget-kicker span { color:#c7a467; font-size:17px; }
        .widget-title { color:#1f302c; font-size:13px; font-weight:720; }
        .widget-copy { margin-top:4px; color:#71807b; font-size:10px; }
        .secure-widget { right:1%; top:23%; display:flex; align-items:center; gap:12px; width:230px; padding:17px 18px; animation:floatMain 7s ease-in-out infinite .6s; }
        .secure-mark { width:34px; height:34px; flex:0 0 auto; display:grid; place-items:center; border:1px solid rgba(41,128,89,.15); border-radius:12px; color:#287b56; background:rgba(219,242,227,.8); font-size:16px; font-weight:800; }
        .activity-widget { right:8%; bottom:11%; width:244px; padding:19px 20px 17px; animation:floatAlt 6.8s ease-in-out infinite 1s; }
        .decorative-bars { display:flex; align-items:flex-end; gap:7px; height:45px; margin-top:15px; padding:0 2px; }
        .decorative-bars i { flex:1; height:42%; border-radius:5px 5px 2px 2px; background:linear-gradient(180deg,rgba(91,181,157,.7),rgba(91,181,157,.17)); }
        .decorative-bars i:nth-child(2) { height:68%; }.decorative-bars i:nth-child(3) { height:48%; }.decorative-bars i:nth-child(4) { height:88%; background:linear-gradient(180deg,rgba(55,164,128,.85),rgba(55,164,128,.2)); }.decorative-bars i:nth-child(5) { height:62%; }.decorative-bars i:nth-child(6) { height:76%; }
        .login-card { position:relative; z-index:2; width:min(410px,100%); padding:32px 30px 25px; border:1px solid rgba(255,255,255,.92); border-radius:20px; background:rgba(255,255,255,.82); box-shadow:0 24px 70px rgba(30,52,58,.14),inset 0 1px 0 rgba(255,255,255,.9); backdrop-filter:blur(22px); -webkit-backdrop-filter:blur(22px); animation:loginEnter .7s cubic-bezier(.2,.75,.25,1) both,floatMain 7s ease-in-out .7s infinite; }
        .login-brand { display:flex; flex-direction:column; align-items:center; gap:5px; margin-bottom:15px; color:#414141; }
        .login-mark { width:38px; height:38px; display:grid; place-items:center; color:#c9a26a; font-size:32px; line-height:1; text-shadow:0 1px 4px rgba(180,138,79,.18); }
        .login-mark span { animation:loginFloat 3s ease-in-out infinite; }
        .login-brand strong { font-size:9px; font-weight:700; letter-spacing:1.3px; }
        .login-heading { margin:14px 0 19px; text-align:center; }
        h1 { margin:0; color:#202124; font-size:17px; font-weight:750; letter-spacing:-.35px; }
        .login-heading p { margin:7px auto 0; max-width:245px; color:#858585; font-size:12px; line-height:1.55; }
        .google-button { width:100%; height:42px; display:flex; align-items:center; justify-content:center; gap:10px; border:1px solid #e7e7e7; border-radius:999px; color:#242424; background:rgba(246,247,247,.93); font:inherit; font-size:12px; font-weight:600; cursor:pointer; transition:background .15s,transform .15s,box-shadow .15s; }
        .google-button:hover:not(:disabled) { transform:translateY(-1px); background:#fff; box-shadow:0 5px 14px rgba(0,0,0,.06); }
        .google-button:disabled { cursor:wait; opacity:.7; }
        .google-button:focus-visible,.login-submit:focus-visible,.login-options button:focus-visible,.password-toggle:focus-visible { outline:2px solid #287b56; outline-offset:3px; }
        .google-button svg { width:17px; height:17px; }
        .login-divider { display:flex; align-items:center; gap:12px; margin:18px 0; color:#777; font-size:10px; white-space:nowrap; }
        .login-divider::before,.login-divider::after { height:1px; flex:1; background:#e8e8e8; content:''; }
        form { display:grid; gap:13px; }
        .login-field { display:grid; gap:6px; }
        .login-field > span:first-child { color:#555; font-size:12px; font-weight:500; }
        .login-field input { width:100%; height:42px; padding:0 14px; border:1px solid #e2e5e3; border-radius:999px; outline:0; color:#202124; background:rgba(255,255,255,.84); font:inherit; font-size:12px; transition:border-color .16s,box-shadow .16s; }
        .login-field input::placeholder { color:#a0a0a0; }
        .login-field input:focus { border-color:#83b59a; box-shadow:0 0 0 3px rgba(38,125,82,.1); }
        .password-wrap { position:relative; display:block; }
        .password-wrap input { padding-right:43px; }
        .password-toggle { position:absolute; top:50%; right:10px; width:24px; height:24px; display:grid; place-items:center; padding:0; transform:translateY(-50%); border:0; color:#333; background:transparent; cursor:pointer; }
        .password-toggle svg { width:16px; height:16px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
        .login-error,.login-notice,.access-note { margin:0; padding:10px 12px; border-radius:9px; font-size:11px; line-height:1.45; }
        .login-error { color:#a23f38; background:#fdecea; }
        .login-notice { color:#28643e; background:#edf7ef; }
        .access-note { padding:0; color:#777; text-align:center; }
        .login-submit { height:43px; margin-top:1px; border:0; border-radius:999px; color:#fff; background:#080a09; font:inherit; font-size:12px; font-weight:650; cursor:pointer; box-shadow:0 9px 18px rgba(0,0,0,.12); transition:background .16s,transform .16s,box-shadow .16s; }
        .login-submit:hover:not(:disabled) { transform:translateY(-1px); background:#202522; box-shadow:0 12px 20px rgba(0,0,0,.15); }
        .login-submit:disabled { cursor:wait; opacity:.72; }
        .login-options { display:flex; justify-content:center; flex-wrap:wrap; gap:5px 15px; margin:15px 0 0; }
        .login-options button { padding:0; border:0; color:#282828; background:transparent; font:inherit; font-size:11px; font-weight:600; cursor:pointer; text-decoration:underline; text-underline-offset:2px; }
        .login-foot { margin:16px 0 0; color:#8c8c8c; text-align:center; font-size:10px; }
        @keyframes loginEnter { from { opacity:0; transform:translateY(18px) scale(.985); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes floatMain { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-11px); } }
        @keyframes floatAlt { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
        @keyframes loginFloat { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-3px); } }
        @keyframes orbDrift { from { transform:translate3d(-8px,-3px,0) scale(1); } to { transform:translate3d(18px,14px,0) scale(1.07); } }
        @media(prefers-reduced-motion:reduce) { *,*::before,*::after { animation-duration:.01ms!important; animation-iteration-count:1!important; transition-duration:.01ms!important; } }
        @media(max-width:900px) { .login-shell { padding:22px 16px; }.login-scene { min-height:auto; }.glass-widget { display:none; }.login-card { padding:30px 25px 24px; animation:loginEnter .55s cubic-bezier(.2,.75,.25,1) both; } }
        @media(max-height:720px) and (min-width:761px) { .login-scene { min-height:660px; }.welcome-widget { top:8%; }.activity-widget { bottom:7%; } }
      `}</style>
    </main>
  );
}
