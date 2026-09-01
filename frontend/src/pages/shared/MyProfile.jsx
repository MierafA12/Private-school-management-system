import { useEffect, useState } from 'react';
import { User, Lock, Save, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { authApi } from '../../api';

// ─── tiny reusable field ─────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.875rem' }}>
    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {label}
    </label>
    {children}
  </div>
);

const Input = ({ value, onChange, type = 'text', placeholder, readOnly }) => (
  <input
    type={type}
    value={value}
    onChange={onChange ? e => onChange(e.target.value) : undefined}
    placeholder={placeholder}
    readOnly={readOnly}
    style={{
      padding: '0.6rem 0.875rem',
      border: '1px solid var(--border-color)',
      borderRadius: 8,
      fontSize: '0.875rem',
      fontFamily: 'inherit',
      background: readOnly ? 'var(--bg-color)' : 'white',
      color: 'var(--text-main)',
      outline: 'none',
      width: '100%',
    }}
    onFocus={e => { if (!readOnly) e.target.style.borderColor = 'var(--primary)'; }}
    onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; }}
  />
);

const Alert = ({ type, msg }) => (
  <div style={{
    padding: '0.75rem 1rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500,
    marginBottom: '1rem',
    background: type === 'success' ? '#F0FDF4' : '#FEF2F2',
    border: `1px solid ${type === 'success' ? '#BBF7D0' : '#FECACA'}`,
    color: type === 'success' ? '#15803D' : '#991B1B',
    display: 'flex', alignItems: 'center', gap: '0.5rem',
  }}>
    {type === 'success' ? <CheckCircle size={16} /> : '⚠️'}
    {msg}
  </div>
);

// ─── Profile Tab ─────────────────────────────────────────────────────────────
function ProfileTab() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [status,  setStatus]  = useState(null); // { type, msg }

  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [phone,      setPhone]      = useState('');
  const [gender,     setGender]     = useState('');
  const [address,    setAddress]    = useState('');

  useEffect(() => {
    authApi.getMe().then(data => {
      setProfile(data);
      setFirstName(data.first_name || '');
      setLastName(data.last_name   || '');
      setPhone(data.phone          || '');
      setGender(data.gender        || '');
      setAddress(data.address      || '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setStatus(null);
    try {
      await authApi.updateProfile({ first_name: firstName, last_name: lastName, phone, gender, address });
      // Update stored user name
      try {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        stored.full_name = `${firstName} ${lastName}`.trim();
        localStorage.setItem('user', JSON.stringify(stored));
      } catch (_) {}
      setStatus({ type: 'success', msg: 'Profile updated successfully.' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Failed to update profile.' });
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <form onSubmit={handleSave}>
      {status && <Alert type={status.type} msg={status.msg} />}

      {/* Read-only info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
        <Field label="Email">
          <Input value={profile?.email || '—'} readOnly />
        </Field>
        <Field label="Role">
          <Input value={profile?.role || '—'} readOnly />
        </Field>
        {profile?.student_number && (
          <Field label="Student Number">
            <Input value={profile.student_number} readOnly />
          </Field>
        )}
        {(profile?.teacher_employee_number || profile?.staff_employee_number) && (
          <Field label="Employee Number">
            <Input value={profile.teacher_employee_number || profile.staff_employee_number} readOnly />
          </Field>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.875rem 0' }} />

      {/* Editable fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
        <Field label="First Name">
          <Input value={firstName} onChange={setFirstName} placeholder="First name" />
        </Field>
        <Field label="Last Name">
          <Input value={lastName} onChange={setLastName} placeholder="Last name" />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={setPhone} placeholder="+254..." type="tel" />
        </Field>
        <Field label="Gender">
          <select
            value={gender}
            onChange={e => setGender(e.target.value)}
            style={{ padding: '0.6rem 0.875rem', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.875rem', background: 'white', color: 'var(--text-main)', width: '100%' }}
          >
            <option value="">— Select —</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </Field>
      </div>
      <Field label="Address">
        <textarea
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Your address"
          rows={2}
          style={{ padding: '0.6rem 0.875rem', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit', background: 'white', color: 'var(--text-main)', resize: 'vertical', width: '100%' }}
        />
      </Field>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.5rem', background: saving ? '#FECACA' : 'var(--primary)',
            color: 'white', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

// ─── Change Password Tab ──────────────────────────────────────────────────────
function PasswordTab() {
  const [current,  setCurrent]  = useState('');
  const [newPw,    setNewPw]    = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [status,   setStatus]   = useState(null);

  const strength = (pw) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const sw = strength(newPw);
  const swColor = ['#E5E7EB','#DC2626','#D97706','#16A34A','#15803D'][sw];
  const swLabel = ['','Weak','Fair','Good','Strong'][sw];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPw !== confirm) { setStatus({ type: 'error', msg: 'Passwords do not match.' }); return; }
    if (newPw.length < 8)  { setStatus({ type: 'error', msg: 'Password must be at least 8 characters.' }); return; }
    setSaving(true); setStatus(null);
    try {
      await authApi.changePassword(current, newPw);
      setStatus({ type: 'success', msg: 'Password changed successfully. Use your new password next time you log in.' });
      setCurrent(''); setNewPw(''); setConfirm('');
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Failed to change password.' });
    } finally { setSaving(false); }
  };

  const PwField = ({ label, value, onChange, show, setShow }) => (
    <Field label={label}>
      <div style={{ position: 'relative' }}>
        <Input type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder="••••••••" />
        <button type="button" onClick={() => setShow(!show)}
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </Field>
  );

  return (
    <form onSubmit={handleSubmit}>
      {status && <Alert type={status.type} msg={status.msg} />}

      <PwField label="Current Password" value={current} onChange={setCurrent} show={showCur} setShow={setShowCur} />
      <PwField label="New Password"     value={newPw}   onChange={setNewPw}   show={showNew} setShow={setShowNew} />

      {newPw && (
        <div style={{ marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: '0.3rem' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: sw >= i ? swColor : '#E5E7EB', transition: 'background 0.3s' }} />
            ))}
          </div>
          {swLabel && <div style={{ fontSize: '0.72rem', color: swColor, fontWeight: 600 }}>{swLabel}</div>}
        </div>
      )}

      <PwField label="Confirm New Password" value={confirm} onChange={setConfirm} show={showNew} setShow={setShowNew} />

      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
        Requirements: minimum 8 characters, at least one uppercase letter and one number.
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" disabled={saving || !current || !newPw || !confirm}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.5rem',
            background: (saving || !current || !newPw || !confirm) ? '#FECACA' : 'var(--primary)',
            color: 'white', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem', border: 'none',
            cursor: (saving || !current || !newPw || !confirm) ? 'not-allowed' : 'pointer',
          }}
        >
          <Lock size={16} /> {saving ? 'Updating…' : 'Change Password'}
        </button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyProfile() {
  const [tab, setTab] = useState('profile');

  const tabs = [
    { key: 'profile',  label: 'My Profile',       icon: User },
    { key: 'password', label: 'Change Password',   icon: Lock },
  ];

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">My Account</h1>
        <p className="sp-page-sub">Manage your personal information and security settings</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.65rem 1.1rem',
              fontWeight: tab === key ? 700 : 500,
              fontSize: '0.875rem',
              color: tab === key ? 'var(--primary)' : 'var(--text-muted)',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'color 0.2s',
            }}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      <div className="sp-card">
        <div className="sp-card-body">
          {tab === 'profile'  && <ProfileTab />}
          {tab === 'password' && <PasswordTab />}
        </div>
      </div>
    </div>
  );
}
