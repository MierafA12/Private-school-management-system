import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, RefreshCw, ShieldOff, ShieldCheck, KeyRound, Lock,
  CheckCircle2, AlertTriangle, X
} from 'lucide-react';
import { registrarApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['', 'Student', 'Parent', 'Teacher', 'Registrar', 'Accountant', 'Principal', 'Super Admin'];
const STATUS_COLOR = { ACTIVE: 'green', INACTIVE: 'gray', LOCKED: 'red', SUSPENDED: 'yellow' };

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—';

// ── Inline reset-password modal ───────────────────────────────────────────────
function ResetModal({ user, currentUser, onClose }) {
  const [pw, setPw]         = useState('');
  const [loading, setLoad]  = useState(false);
  const [done, setDone]     = useState(false);
  const [err, setErr]       = useState(null);

  const isRegistrar = currentUser?.role === 'Registrar';
  const isBlocked = isRegistrar && ['Super Admin', 'Principal'].includes(user?.role);

  const submit = async (e) => {
    e.preventDefault();
    if (isBlocked) {
      setErr(`Registrars are not authorized to reset passwords for ${user?.role} accounts.`);
      return;
    }
    if (pw.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    setLoad(true);
    setErr(null);
    try {
      await registrarApi.resetPassword(user.id, pw);
      setDone(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoad(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500,
      backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: 'var(--card-bg, #FFFFFF)',
        border: '1px solid var(--border-color, #E2E8F0)',
        borderRadius: 10,
        padding: '1.75rem',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        position: 'relative',
      }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14, background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--text-muted, #64748B)', padding: 4, borderRadius: 4,
          }}
          title="Close"
        >
          <X size={16} />
        </button>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <CheckCircle2 size={36} color="#16A34A" />
            </div>
            <h3 style={{ fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-main)' }}>
              Password Reset
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 1.25rem' }}>
              The new temporary password for <strong>{user?.full_name || user?.email}</strong> has been saved. The user can log in with it immediately.
            </p>
            <button
              onClick={onClose}
              className="btn-prim"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h3 style={{ fontWeight: 700, margin: '0 0 0.35rem', color: 'var(--text-main)', fontSize: '1.05rem' }}>
              Reset Password
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
              Assign a new temporary password for <strong>{user?.full_name || user?.email}</strong> ({user?.role}).
            </p>

            {isBlocked ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem',
                borderRadius: 6, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--primary, #991B1B)', fontSize: '0.8125rem', marginBottom: '1.25rem'
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>Protected Account: Registrars are not authorized to reset passwords for Super Admin or Principal accounts.</span>
              </div>
            ) : (
              <>
                {err && (
                  <div style={{
                    padding: '0.5rem 0.75rem', borderRadius: 6, background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--primary, #991B1B)',
                    fontSize: '0.8125rem', marginBottom: '1rem'
                  }}>
                    {err}
                  </div>
                )}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    New Temporary Password
                  </label>
                  <input
                    type="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="Min 6 characters"
                    className="rg-input"
                    required
                    minLength={6}
                    autoFocus
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost"
              >
                Cancel
              </button>
              {!isBlocked && (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-prim"
                >
                  {loading ? 'Saving…' : 'Save Password'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function UserList() {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const [search,  setSearch]  = useState(searchParams.get('search') || '');
  const [role,    setRole]    = useState(searchParams.get('role')   || '');
  const [offset,  setOffset]  = useState(0);
  const LIMIT = 25;

  const [resetUser,   setResetUser]   = useState(null);
  const [actionLoad,  setActionLoad]  = useState(null); // userId being toggled

  const isRegistrar = currentUser?.role === 'Registrar';

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

  const toggleStatus = async (userId, currentStatus, targetRole) => {
    // Client-side guard for Registrars modifying Super Admin or Principal
    if (isRegistrar && ['Super Admin', 'Principal'].includes(targetRole)) {
      alert(`Registrars are not authorized to change the status or deactivate ${targetRole} accounts.`);
      return;
    }
    if (userId === currentUser?.id) {
      alert('You cannot deactivate your own account.');
      return;
    }
    if (targetRole === 'Super Admin' && currentStatus === 'ACTIVE') {
      alert('Super Admin accounts cannot be deactivated.');
      return;
    }

    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setActionLoad(userId);
    try {
      await registrarApi.setUserStatus(userId, newStatus);
      setUsers((u) => u.map((x) => (x.id === userId ? { ...x, status: newStatus } : x)));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoad(null);
    }
  };

  const pages = Math.ceil(total / LIMIT);
  const page  = Math.floor(offset / LIMIT);

  return (
    <div>
      <div className="sp-page-header">
        <div>
          <h1 className="sp-page-title">User Accounts Directory</h1>
          <p className="sp-page-sub">{total} registered accounts across all roles</p>
        </div>
      </div>

      {/* Search and filter bar */}
      <form className="rg-search-bar" onSubmit={handleSearch}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="rg-search-input"
            style={{ paddingLeft: '2rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or ID number…"
          />
        </div>
        <select
          className="rg-select"
          style={{ width: 160 }}
          value={role}
          onChange={(e) => { setRole(e.target.value); setOffset(0); }}
        >
          {ROLES.map((r) => <option key={r} value={r}>{r || 'All Roles'}</option>)}
        </select>
        <button type="submit" className="btn-prim">
          Search
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => { setSearch(''); setRole(''); setOffset(0); setSearchParams({}); }}
          title="Reset filters"
        >
          <RefreshCw size={15} />
        </button>
      </form>

      {loading ? (
        <LoadingSpinner message="Loading user directory…" />
      ) : error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : (
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
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                      No users match your criteria
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isProtected = ['Super Admin', 'Principal'].includes(u.role);
                    const cannotManage = isRegistrar && isProtected;
                    const isSelf = u.id === currentUser?.id;
                    const isSuperAdmin = u.role === 'Super Admin';

                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                        <td>
                          <span className={`sp-badge ${isProtected ? 'sp-badge--red' : 'sp-badge--blue'}`}>
                            {u.role}
                          </span>
                        </td>
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
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            {/* Reset password button */}
                            {cannotManage ? (
                              <button
                                type="button"
                                disabled
                                title={`Protected: Registrars cannot reset passwords for ${u.role} accounts`}
                                style={{
                                  padding: '0.35rem',
                                  borderRadius: 6,
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-muted)',
                                  opacity: 0.35,
                                  cursor: 'not-allowed',
                                }}
                              >
                                <Lock size={13} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                title="Reset password"
                                onClick={() => setResetUser(u)}
                                style={{
                                  padding: '0.35rem',
                                  borderRadius: 6,
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-muted)',
                                  background: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                <KeyRound size={14} />
                              </button>
                            )}

                            {/* Toggle active / deactivate button */}
                            {cannotManage ? (
                              <button
                                type="button"
                                disabled
                                title={`Protected: Registrars cannot deactivate or change status for ${u.role} accounts`}
                                style={{
                                  padding: '0.35rem',
                                  borderRadius: 6,
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-muted)',
                                  opacity: 0.35,
                                  cursor: 'not-allowed',
                                }}
                              >
                                <ShieldOff size={13} />
                              </button>
                            ) : isSelf ? (
                              <button
                                type="button"
                                disabled
                                title="You cannot deactivate your own account"
                                style={{
                                  padding: '0.35rem',
                                  borderRadius: 6,
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-muted)',
                                  opacity: 0.35,
                                  cursor: 'not-allowed',
                                }}
                              >
                                <ShieldOff size={13} />
                              </button>
                            ) : isSuperAdmin && u.status === 'ACTIVE' ? (
                              <button
                                type="button"
                                disabled
                                title="Super Admin accounts cannot be deactivated"
                                style={{
                                  padding: '0.35rem',
                                  borderRadius: 6,
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-muted)',
                                  opacity: 0.35,
                                  cursor: 'not-allowed',
                                }}
                              >
                                <ShieldCheck size={13} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                title={u.status === 'ACTIVE' ? 'Deactivate user' : 'Activate user'}
                                disabled={actionLoad === u.id}
                                onClick={() => toggleStatus(u.id, u.status, u.role)}
                                style={{
                                  padding: '0.35rem',
                                  borderRadius: 6,
                                  border: '1px solid var(--border-color)',
                                  color: u.status === 'ACTIVE' ? 'var(--primary, #991B1B)' : '#16A34A',
                                  background: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                {u.status === 'ACTIVE' ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.25rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)' }}>
              <button disabled={page === 0} onClick={() => setOffset((o) => o - LIMIT)} className="btn-ghost">
                ← Prev
              </button>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Page {page + 1} of {pages}</span>
              <button disabled={page >= pages - 1} onClick={() => setOffset((o) => o + LIMIT)} className="btn-ghost">
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {resetUser && (
        <ResetModal
          user={resetUser}
          currentUser={currentUser}
          onClose={() => { setResetUser(null); load(); }}
        />
      )}
    </div>
  );
}
