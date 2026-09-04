import { useEffect, useState } from 'react';
import {
  School, Building, Phone, Mail, Save, CheckCircle2, Award,
} from 'lucide-react';
import EthiopiaFlag from '../../components/shared/EthiopiaFlag';
import { principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';
import './principal.css';

export default function SchoolProfile() {
  const [profile, setProfile] = useState({
    name: '',
    motto: '',
    logo_url: '',
    address: '',
    city: '',
    country: 'Ethiopia',
    phone: '',
    email: '',
    website: '',
    registration_number: '',
    principal_name: '',
    currency: 'ETB',
    academic_year_start_month: 1,
    terms_per_year: 3,
  });

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await principalApi.getSchoolProfile();
      if (data) {
        setProfile((prev) => ({
          ...prev,
          ...data,
          country: data.country || 'Ethiopia',
          currency: data.currency || 'ETB',
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load school profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      const updated = await principalApi.updateSchoolProfile({
        ...profile,
        country: 'Ethiopia',
      });
      if (updated) {
        setProfile((prev) => ({ ...prev, ...updated, country: 'Ethiopia' }));
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4500);
    } catch (err) {
      setError(err.message || 'Failed to save school profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading school profile…" />;
  if (error && !profile.name) return <ErrorBanner message={error} onRetry={loadProfile} />;

  const initials = (profile.name || 'EduFlow School')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto' }}>
      {/* ── Page Header ── */}
      <div className="sp-page-header" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="sp-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <School size={20} style={{ color: 'var(--primary, #991B1B)' }} />
              School Profile
            </h1>
            <p className="sp-page-sub">
              Manage official school details, accreditation, contact info, and operational settings.
            </p>
          </div>
          <button
            type="button"
            className="btn-prim"
            onClick={handleSubmit}
            disabled={saving}
          >
            <Save size={14} />
            <span>{saving ? 'Saving…' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {success && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: 6,
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            color: '#166534',
            marginBottom: '1rem',
            fontSize: '0.8125rem',
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={16} color="#16A34A" />
          School profile updated successfully.
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={loadProfile} />}

      {/* ── Two-Column Layout: Form on Left, Identity Summary on Right ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* Left Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Card 1: Identity */}
          <div className="sp-card" style={{ padding: '1.25rem' }}>
            <div className="pc-section-title">
              <School size={15} />
              Institutional Identity
            </div>
            <div className="pf-grid-2">
              <div className="pf-field">
                <label className="pf-label">School Official Name <span>*</span></label>
                <input
                  type="text"
                  name="name"
                  className="pf-input"
                  value={profile.name || ''}
                  onChange={handleChange}
                  placeholder="e.g. EduFlow International Academy"
                  required
                />
              </div>
              <div className="pf-field">
                <label className="pf-label">Motto / Tagline</label>
                <input
                  type="text"
                  name="motto"
                  className="pf-input"
                  value={profile.motto || ''}
                  onChange={handleChange}
                  placeholder="e.g. Inspiring Excellence Every Day"
                />
              </div>
            </div>

            <div className="pf-grid-2">
              <div className="pf-field">
                <label className="pf-label">Accreditation / Registration No.</label>
                <input
                  type="text"
                  name="registration_number"
                  className="pf-input"
                  value={profile.registration_number || ''}
                  onChange={handleChange}
                  placeholder="e.g. MOE/PRI/2026/042"
                />
              </div>
              <div className="pf-field">
                <label className="pf-label">Principal / Head of Institution</label>
                <input
                  type="text"
                  name="principal_name"
                  className="pf-input"
                  value={profile.principal_name || ''}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Jane Doe, Ph.D."
                />
              </div>
            </div>

            <div className="pf-field" style={{ marginBottom: 0 }}>
              <label className="pf-label">Official Logo URL</label>
              <input
                type="url"
                name="logo_url"
                className="pf-input"
                value={profile.logo_url || ''}
                onChange={handleChange}
                placeholder="https://example.com/logo.png (optional)"
              />
            </div>
          </div>

          {/* Card 2: Contact & Location */}
          <div className="sp-card" style={{ padding: '1.25rem' }}>
            <div className="pc-section-title">
              <Building size={15} />
              Location & Contact
            </div>
            <div className="pf-grid-2">
              <div className="pf-field">
                <label className="pf-label">Contact Email</label>
                <input
                  type="email"
                  name="email"
                  className="pf-input"
                  value={profile.email || ''}
                  onChange={handleChange}
                  placeholder="admin@school.com"
                />
              </div>
              <div className="pf-field">
                <label className="pf-label">Phone Number</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0 0.75rem',
                      height: 36,
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRight: 'none',
                      borderTopLeftRadius: 6,
                      borderBottomLeftRadius: 6,
                      fontSize: '0.8125rem',
                      color: '#334155',
                      fontWeight: 600,
                      userSelect: 'none',
                      flexShrink: 0,
                    }}
                    title="Ethiopia (+251)"
                  >
                    <EthiopiaFlag width={20} height={14} />
                    <span>+251</span>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    className="pf-input"
                    style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                    value={profile.phone || ''}
                    onChange={handleChange}
                    placeholder="911 234 567"
                  />
                </div>
              </div>
            </div>

            <div className="pf-grid-2">
              <div className="pf-field">
                <label className="pf-label">City / Region</label>
                <input
                  type="text"
                  name="city"
                  className="pf-input"
                  value={profile.city || ''}
                  onChange={handleChange}
                  placeholder="e.g. Addis Ababa"
                />
              </div>
              <div className="pf-field">
                <label className="pf-label">Country</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 0.75rem',
                      height: 36,
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRight: 'none',
                      borderTopLeftRadius: 6,
                      borderBottomLeftRadius: 6,
                      flexShrink: 0,
                    }}
                    title="Ethiopia"
                  >
                    <EthiopiaFlag width={20} height={14} />
                  </div>
                  <input
                    type="text"
                    name="country"
                    className="pf-input"
                    style={{
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      background: '#F8FAFC',
                      color: '#0F172A',
                      fontWeight: 500,
                      cursor: 'default',
                    }}
                    value="Ethiopia"
                    readOnly
                    title="Country is permanently configured to Ethiopia"
                  />
                </div>
              </div>
            </div>

            <div className="pf-field">
              <label className="pf-label">Physical Street Address</label>
              <input
                type="text"
                name="address"
                className="pf-input"
                value={profile.address || ''}
                onChange={handleChange}
                placeholder="Bole Sub-City, Woreda 03"
              />
            </div>

            <div className="pf-field" style={{ marginBottom: 0 }}>
              <label className="pf-label">Official Website</label>
              <input
                type="url"
                name="website"
                className="pf-input"
                value={profile.website || ''}
                onChange={handleChange}
                placeholder="https://www.eduflow.edu.et"
              />
            </div>
          </div>

          {/* Card 3: Academic System & Regional Defaults */}
          <div className="sp-card" style={{ padding: '1.25rem' }}>
            <div className="pc-section-title">
              <Award size={15} />
              System Defaults & Regional Settings
            </div>
            <div className="pf-grid-2">
              <div className="pf-field">
                <label className="pf-label">Reporting Currency</label>
                <select
                  name="currency"
                  className="pf-select"
                  value={profile.currency || 'ETB'}
                  onChange={handleChange}
                >
                  <option value="ETB">ETB — Ethiopian Birr (Br)</option>
                  <option value="USD">USD — US Dollar ($)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                  <option value="GBP">GBP — British Pound (£)</option>
                  <option value="KES">KES — Kenyan Shilling</option>
                  <option value="TZS">TZS — Tanzanian Shilling</option>
                  <option value="UGX">UGX — Ugandan Shilling</option>
                </select>
              </div>
              <div className="pf-field">
                <label className="pf-label">Terms Per Academic Year</label>
                <select
                  name="terms_per_year"
                  className="pf-select"
                  value={profile.terms_per_year || 3}
                  onChange={handleChange}
                >
                  <option value={2}>2 Semesters (Standard)</option>
                  <option value={3}>3 Terms (Trimesters)</option>
                  <option value={4}>4 Quarters</option>
                </select>
              </div>
            </div>
          </div>
        </form>

        {/* Right Column: School Identity Summary */}
        <div>
          <div className="school-summary-card">
            <div className="school-summary-header">
              <div className="school-summary-emblem">
                {profile.logo_url ? (
                  <img
                    src={profile.logo_url}
                    alt="School Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4 }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  initials
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3 className="school-summary-title">{profile.name || 'School Name'}</h3>
                {profile.motto && (
                  <p className="school-summary-motto">{profile.motto}</p>
                )}
              </div>
            </div>

            <div className="school-summary-row">
              <span className="school-summary-row-label">Registration</span>
              <span className="school-summary-row-val">{profile.registration_number || '—'}</span>
            </div>
            <div className="school-summary-row">
              <span className="school-summary-row-label">Principal</span>
              <span className="school-summary-row-val">{profile.principal_name || '—'}</span>
            </div>
            <div className="school-summary-row">
              <span className="school-summary-row-label">Location</span>
              <span className="school-summary-row-val">
                {[profile.city || 'Addis Ababa', profile.country || 'Ethiopia'].filter(Boolean).join(', ')}
              </span>
            </div>
            {profile.email && (
              <div className="school-summary-row">
                <span className="school-summary-row-label">Email</span>
                <span className="school-summary-row-val">{profile.email}</span>
              </div>
            )}
            {profile.phone && (
              <div className="school-summary-row">
                <span className="school-summary-row-label">Phone</span>
                <span className="school-summary-row-val" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <EthiopiaFlag width={18} height={12} />
                  <span>{profile.phone.startsWith('+251') ? profile.phone : `+251 ${profile.phone}`}</span>
                </span>
              </div>
            )}
            <div className="school-summary-row">
              <span className="school-summary-row-label">Default Currency</span>
              <span className="school-summary-row-val">{profile.currency || 'ETB'}</span>
            </div>
            <div className="school-summary-row">
              <span className="school-summary-row-label">Academic Cycle</span>
              <span className="school-summary-row-val">{profile.terms_per_year || 3} Terms / Year</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
