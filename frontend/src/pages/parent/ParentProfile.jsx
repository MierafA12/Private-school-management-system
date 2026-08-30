import { useState, useEffect } from 'react';
import { parentApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';

export default function ParentProfile() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [prefs,   setPrefs]   = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const d = await parentApi.getProfile();
      setData(d);
      setPrefs(d.notification_preferences);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = (key) => {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
    setSaved(false);
  };

  const savePrefs = async () => {
    try {
      setSaving(true);
      await parentApi.updateNotificationPrefs(prefs);
      setSaved(true);
    } catch (_) {}
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner message="Loading profile…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;
  if (!data)   return null;

  const { parent } = data;

  const NOTIFICATION_TOGGLES = [
    { key: 'email_enabled',       label: 'Email Notifications',   sub: 'Receive alerts via email' },
    { key: 'sms_enabled',         label: 'SMS Notifications',     sub: 'Receive alerts via SMS (requires setup)' },
    { key: 'fee_alerts',          label: 'Fee Alerts',            sub: 'Invoice due dates and payment confirmations' },
    { key: 'attendance_alerts',   label: 'Attendance Alerts',     sub: "Notify when child is absent or late" },
    { key: 'grade_alerts',        label: 'Grade Alerts',          sub: 'When exam results are published' },
    { key: 'announcement_alerts', label: 'Announcement Alerts',   sub: 'School notices and events' },
  ];

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">My Profile</h1>
        <p className="sp-page-sub">Your account details and notification preferences</p>
      </div>

      <div className="sp-two-col">
        {/* Profile info */}
        <div className="sp-card">
          <div className="sp-card-header">
            <span className="sp-card-title">Account Details</span>
          </div>
          <div className="sp-card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="pp-child-avatar" style={{ width: 64, height: 64, fontSize: '1.4rem' }}>
                {(parent.first_name || '')[0]}{(parent.last_name || '')[0]}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {parent.first_name} {parent.last_name}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {parent.relationship || 'Parent / Guardian'}
                </div>
              </div>
            </div>

            <div className="pp-profile-grid">
              {[
                { label: 'Email',        value: parent.email          || '—' },
                { label: 'Phone',        value: parent.phone          || '—' },
                { label: 'Emergency',    value: parent.emergency_phone || '—' },
                { label: 'Occupation',   value: parent.occupation      || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="pp-form-group">
                  <label>{label}</label>
                  <input type="text" value={value} readOnly style={{ background: 'var(--bg-color)', cursor: 'default' }} />
                </div>
              ))}
            </div>

            {parent.address && (
              <div className="pp-form-group" style={{ marginTop: '0.75rem' }}>
                <label>Address</label>
                <input type="text" value={parent.address} readOnly style={{ background: 'var(--bg-color)', cursor: 'default' }} />
              </div>
            )}

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
              To update your contact details, please contact the school registrar.
            </p>
          </div>
        </div>

        {/* Notification preferences */}
        <div className="sp-card">
          <div className="sp-card-header">
            <span className="sp-card-title">Notification Preferences</span>
            {saved && <span className="sp-badge sp-badge--green">Saved ✓</span>}
          </div>
          <div className="sp-card-body">
            {prefs && NOTIFICATION_TOGGLES.map(({ key, label, sub }) => (
              <div key={key} className="pp-toggle-row">
                <div>
                  <div className="pp-toggle-label">{label}</div>
                  <div className="pp-toggle-sub">{sub}</div>
                </div>
                <label className="pp-toggle">
                  <input type="checkbox" checked={!!prefs[key]} onChange={() => handleToggle(key)} />
                  <span className="pp-toggle-slider" />
                </label>
              </div>
            ))}

            <button
              onClick={savePrefs}
              disabled={saving}
              style={{
                marginTop: '1.25rem',
                width: '100%',
                padding: '0.75rem',
                background: 'var(--accent)',
                color: 'white',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'var(--transition)',
              }}
            >
              {saving ? 'Saving…' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
