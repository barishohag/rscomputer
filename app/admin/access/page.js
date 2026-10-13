'use client';

import { useCallback, useEffect, useState } from 'react';

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/registrations', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load access requests.');
      setRequests(result.requests || []);
    } catch (err) {
      setError(err.message || 'Could not load access requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  async function decide(userId, status) {
    setWorking(userId);
    setError('');
    try {
      const response = await fetch('/api/admin/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update this request.');
      setRequests(current => current.filter(request => request.user_id !== userId));
    } catch (err) {
      setError(err.message || 'Could not update this request.');
    } finally {
      setWorking('');
    }
  }

  return (
    <main className="admin-shell">
      <section className="admin-card">
        <a className="back-link" href="/">← Back to dashboard</a>
        <p className="eyebrow">RS COMPUTER · ADMIN</p>
        <h1>Account access requests</h1>
        <p className="intro">Review each new account before allowing it into the shop dashboard.</p>
        {error && <p className="error" role="alert">{error}</p>}
        {loading ? <p className="empty">Loading requests…</p> : requests.length === 0 ? (
          <p className="empty">There are no pending access requests.</p>
        ) : (
          <ul className="request-list">
            {requests.map(request => (
              <li className="request" key={request.user_id}>
                <div className="request-info">
                  <strong>{request.email}</strong>
                  <span>Requested {new Date(request.requested_at).toLocaleString()}</span>
                </div>
                <div className="actions">
                  <button className="approve" type="button" disabled={working === request.user_id} onClick={() => decide(request.user_id, 'approved')}>
                    {working === request.user_id ? 'Saving…' : 'Approve'}
                  </button>
                  <button className="reject" type="button" disabled={working === request.user_id} onClick={() => decide(request.user_id, 'rejected')}>Reject</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button className="refresh" type="button" disabled={loading} onClick={loadRequests}>Refresh list</button>
      </section>
      <style jsx>{`
        .admin-shell { min-height:100vh; display:grid; place-items:center; padding:24px; color:#202124; background:#f5f6f4; }
        .admin-card { width:min(100%,720px); padding:32px; border:1px solid #e9ece9; border-radius:16px; background:white; box-shadow:0 18px 50px rgba(0,0,0,.06); }
        .back-link { color:#555; font-size:12px; text-decoration:none; }
        .eyebrow { margin:28px 0 7px; color:#347750; font-size:10px; font-weight:750; letter-spacing:1.1px; }
        h1 { margin:0; font-size:24px; letter-spacing:-.6px; }
        .intro { margin:8px 0 22px; color:#717773; font-size:13px; }
        .request-list { display:grid; gap:10px; margin:0; padding:0; list-style:none; }
        .request { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:16px; border:1px solid #e8ebe8; border-radius:12px; }
        .request-info { min-width:0; display:grid; gap:5px; }
        .request-info strong { overflow-wrap:anywhere; font-size:14px; }
        .request-info span,.empty { color:#777; font-size:12px; }
        .actions { display:flex; gap:8px; flex-shrink:0; }
        .actions button,.refresh { min-height:36px; padding:0 14px; border-radius:999px; font:inherit; font-size:12px; font-weight:650; cursor:pointer; }
        .approve { border:1px solid #21643d; color:white; background:#21643d; }
        .reject { border:1px solid #e5e5e5; color:#444; background:white; }
        button:disabled { cursor:wait; opacity:.65; }
        .refresh { margin-top:18px; border:1px solid #e5e5e5; color:#333; background:white; }
        .error { padding:11px 13px; border-radius:9px; color:#9d302b; background:#fff0ef; font-size:12px; }
        .empty { padding:22px 0 8px; }
        @media(max-width:560px) { .admin-card { padding:24px 18px; } .request { align-items:flex-start; flex-direction:column; } }
      `}</style>
    </main>
  );
}
