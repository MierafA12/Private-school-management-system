import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, RefreshCw, ShieldOff, ShieldCheck, KeyRound } from 'lucide-react';
import { registrarApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';

const ROLES = ['', 'Student', 'Parent', 'Teacher', 'Registrar', 'Accountant', 'Principal', 'Super Admin'];
const STATUS_COLOR = { ACTIVE: 'green', INACTIVE: 'gray', LOCKED: 'red', SUSPENDED: 'yellow' };

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—';

// ── Inline reset-password modal ───────────────────────────────────────────────
function ResetModal({ userId, onClose }) {
  const [pw, setPw]         = useState('');
  const [loading, setLoad]  = useState(false);
  const [done, setDone]     = useState(false);
  const [err, setErr]       = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 6) { setErr('Minimum 6 characters.'); return; }
    setLoad(true); setErr(null);
    try {
      await registrarApi.resetPassword(userId, pw);
      setDone(true);
    } catch (e) { setErr(e.message); }
    finally { setLoad(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500,
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: '1.75rem',
        width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <h3 style={{ fontWeight: 700 }}>Password Reset</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.5rem 0 1rem' }}>
              The new password has been saved. The user can log in with it immediately.
            </p>
            <button onClick={onClose} style={{ padding: '0.6rem 1.5rem', background: 'var(--primary)', color: 'white', borderRadius: 8, fontWeight: 600 }}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Reset Password</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Set a new temporary password for this user.
            </p>
            {err && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{err}</p>}
            <input
              type="password" value={pw} onChange={e => setPw(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="rg-input" style={{ marginBottom: '1rem' }} required
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} style={{ padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', fontWeight: 600 }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ padding: '0.6rem 1rem', background: 'var(--primary)', color: 'white', borderRadius: 8, fontWeight: 600 }}>
                {loading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function UserList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const [search,  setSearch]  = useState(searchParams.get('search') || '');
  const [role,    setRole]    = useState(searchParams.get('role')   || '');
  const [offset,  setOffset]  = useState(0);
  const LIMIT = 25;

  const [resetUserId, setResetUserId] = useState(null);
  const [actionLoad,  setActionLoad]  = useState(null); // userId being toggled

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { limit: LIMIT, offset };
      if (role)   params.role   = role;
      if (search) params.search = search;
      const data = await registrarApi.getUsers(params);
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [role, search, offset]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setOffset(0);
    const p = {};
    if (role)   p.role = role;
    if (search) p.search = search;
    setSearchParams(p);
  };

  const toggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setActionLoad(userId);
    try {
      await registrarApi.setUserStatus(userId, newStatus);
      setUsers(u => u.map(x => x.id === userId ? { ...x, status: newStatus } : x));
    } catch (err) { alert(err.message); }
    finally { setActionLoad(null); }
  };

  const pages = Math.ceil(total / LIMIT);
  const page  = Math.floor(offset / LIMIT);

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">All Users</h1>
        <p className="sp-page-sub">{total} registered accounts</p>
      </div>

      {/* Search bar */}
      <form className="rg-search-bar" onSubmit={handleSearch}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="rg-search-input"
            style={{ paddingLeft: '2rem' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
          />
        </div>
        <select
          className="rg-select"
          style={{ width: 160 }}
          value={role}
          onChange={e => { setRole(e.target.value); setOffset(0); }}
        >
          {ROLES.map(r => <option key={r} value={r}>{r || 'All Roles'}</option>)}
        </select>
        <button type="submit" style={{ padding: '0.6rem 1rem', background: 'var(--primary)', color: 'white', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem' }}>
          Search
        </button>
        <button type="button" onClick={() => { setSearch(''); setRole(''); setOffset(0); setSearchParams({}); }} style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
          <RefreshCw size={16} />
        </button>
      </form>

      {loading ? <LoadingSpinner message="Loading users…" /> :
       error   ? <ErrorBanner message={error} onRetry={load} /> : (
        <div className="sp-card">
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email / Phone</th>
                  <th>ID Number</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No users found</td></tr>
                ) : users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                    <td><span className="sp-badge sp-badge--blue">{u.role}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {u.email && <div>{u.email}</div>}
                      {u.phone && <div>{u.phone}</div>}
                    </td>
                    <td style={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>{u.id_number || '—'}</td>
                    <td>
                      <span className={`sp-badge sp-badge--${STATUS_COLOR[u.status] || 'gray'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fmtDate(u.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {/* Reset password */}
                        <button
                          title="Reset password"
                          onClick={() => setResetUserId(u.id)}
                          style={{ padding: '0.35rem', borderRadius: 6, border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                        >
                          <KeyRound size={14} />
                        </button>
                        {/* Toggle active */}
                        <button
                          title={u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          disabled={actionLoad === u.id}
                          onClick={() => toggleStatus(u.id, u.status)}
                          style={{
                            padding: '0.35rem', borderRadius: 6,
                            border: '1px solid var(--border-color)',
                            color: u.status === 'ACTIVE' ? 'var(--primary)' : '#16A34A',
                          }}
                        >
                          {u.status === 'ACTIVE' ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.25rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)' }}>
              <button disabled={page === 0} onClick={() => setOffset(o => o - LIMIT)} style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid var(--border-color)', fontWeight: 600, color: page === 0 ? 'var(--text-muted)' : 'var(--text-main)' }}>← Prev</button>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Page {page + 1} of {pages}</span>
              <button disabled={page >= pages - 1} onClick={() => setOffset(o => o + LIMIT)} style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid var(--border-color)', fontWeight: 600, color: page >= pages - 1 ? 'var(--text-muted)' : 'var(--text-main)' }}>Next →</button>
            </div>
          )}
        </div>
      )}

      {resetUserId && (
        <ResetModal userId={resetUserId} onClose={() => { setResetUserId(null); load(); }} />
      )}
    </div>
  );
}
