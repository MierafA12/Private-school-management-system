import { useState, useEffect } from 'react';
import { notificationApi } from '../../api';
import { LoadingSpinner } from './PageState';
import "../../styles/components/notifications.css";

const ROWS = [
  { key: 'fee_alerts',          label: 'Fee & Invoice Alerts',      sub: 'Due dates, overdue reminders'         },
  { key: 'attendance_alerts',   label: 'Attendance Alerts',         sub: 'Absences and tardiness notifications' },
  { key: 'results_alerts',      label: 'Grades & Report Cards',     sub: 'When results or reports are published'},
  { key: 'announcement_alerts', label: 'Announcements & Events',    sub: 'School-wide notices and events'       },
  { key: 'new_message_alerts',  label: 'Messages',                  sub: 'New messages from teachers or parents'},
];
const CHANNELS = [
  { key: 'email_enabled', label: 'Email' },
  { key: 'sms_enabled',   label: 'SMS'   },
];

export default function NotificationPreferences() {
  const [prefs,   setPrefs]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    notificationApi.getPreferences()
      .then(setPrefs)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key) => {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
    setSaved(false);
  };

  const save = async () => {
    try {
      setSaving(true); setSaved(false);
      await notificationApi.updatePreferences(prefs);
      setSaved(true);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner message="Loading preferences…" />;
  if (error)   return <div style={{ color:'var(--primary)', fontSize:'.875rem' }}>⚠️ {error}</div>;
  if (!prefs)  return null;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
        <div>
          <div style={{ fontWeight:700, fontSize:'.95rem' }}>Notification Preferences</div>
          <div style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>
            Choose which notifications you receive and through which channels
          </div>
        </div>
        {saved && <span className="sp-badge sp-badge--green">Saved ✓</span>}
      </div>

      {/* Channel master toggles */}
      <div style={{ display:'flex', gap:'1.5rem', marginBottom:'1.25rem', padding:'.75rem 1rem', background:'var(--bg-color)', borderRadius:10 }}>
        {CHANNELS.map(({ key, label }) => (
          <label key={key} style={{ display:'flex', alignItems:'center', gap:'.5rem', cursor:'pointer', fontSize:'.875rem', fontWeight:500 }}>
            <label className="notif-toggle">
              <input type="checkbox" checked={!!prefs[key]} onChange={() => toggle(key)} />
              <span className="notif-toggle-slider" />
            </label>
            {label}
          </label>
        ))}
      </div>

      {/* Per-type toggles */}
      <div className="notif-pref-grid">
        <div className="notif-pref-header">Notification Type</div>
        <div className="notif-pref-header">In-App</div>
        <div className="notif-pref-header">Enabled</div>

        {ROWS.map(({ key, label, sub }) => (
          <div key={key} className="notif-pref-row">
            <div className="notif-pref-label">
              {label}
              <div className="notif-pref-label-sub">{sub}</div>
            </div>
            <div className="notif-pref-cell">
              <span style={{ fontSize:'1rem' }}>✅</span>
            </div>
            <div className="notif-pref-cell">
              <label className="notif-toggle">
                <input type="checkbox" checked={!!prefs[key]} onChange={() => toggle(key)} />
                <span className="notif-toggle-slider" />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving}
        style={{
          marginTop:'1.25rem', padding:'.75rem 2rem',
          background:'var(--primary)', color:'white',
          fontWeight:700, borderRadius:'var(--radius-sm)',
          border:'none', cursor:'pointer', fontSize:'.875rem',
          transition:'var(--transition)',
        }}
      >{saving ? 'Saving…' : 'Save Preferences'}</button>
    </div>
  );
}
