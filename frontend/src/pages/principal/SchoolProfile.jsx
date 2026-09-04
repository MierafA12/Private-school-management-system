import { useEffect, useState } from 'react';
import { School, Building, Phone, Mail, Globe, Save, CheckCircle2 } from 'lucide-react';
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
    country: 'Kenya',
    phone: '',
    email: '',
    website: '',
    registration_number: '',
    principal_name: '',
    currency: 'KES',
    academic_year_start_month: 1,
    terms_per_year: 3,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
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
          country: data.country || 'Kenya',
          currency: data.currency || 'KES',
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
      const updated = await principalApi.updateSchoolProfile(profile);
      if (updated) {
        setProfile((prev) => ({ ...prev, ...updated }));
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save school profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading school profile…" />;
  if (error && !profile.name) return <ErrorBanner message={error} onRetry={loadProfile} />;

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="sp-page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="sp-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <School size={24} /> School Profile
          </h1>
          <p className="sp-page-sub">
            Manage your school identity, official accreditation details, and default settings
          </p>
        </div>
      </div>

      {success && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.85rem 1.25rem',
          borderRadius: 8,
          background: '#DCFCE7',
          color: '#166534',
          marginBottom: '1.25rem',
          fontSize: '0.875rem',
          fontWeight: 600,
        }}>
          <CheckCircle2 size={18} />
          School profile updated successfully.
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={loadProfile} />}

      <form onSubmit={handleSubmit} className="sp-card" style={{ padding: '1.75rem' }}>
        {/* Basic Identity */}
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
          General Information
        </h3>
        <div className="pf-grid-2">
          <div className="pf-field">
            <label className="pf-label">School Name <span>*</span></label>
            <input
              type="text"
              name="name"
              className="pf-input"
              value={profile.name || ''}
              onChange={handleChange}
              placeholder="e.g. Greenwood Academy"
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
              placeholder="e.g. Striving for Excellence"
            />
          </div>
        </div>

        <div className="pf-grid-2">
          <div className="pf-field">
            <label className="pf-label">Registration / Accreditation No.</label>
            <input
              type="text"
              name="registration_number"
              className="pf-input"
              value={profile.registration_number || ''}
              onChange={handleChange}
              placeholder="e.g. MOE/PRI/2024/001"
            />
          </div>
          <div className="pf-field">
            <label className="pf-label">Principal / Head of School</label>
            <input
              type="text"
              name="principal_name"
              className="pf-input"
              value={profile.principal_name || ''}
              onChange={handleChange}
              placeholder="Full name of Principal"
            />
          </div>
        </div>

        <div className="pf-field">
          <label className="pf-label">Logo URL</label>
          <input
            type="url"
            name="logo_url"
            className="pf-input"
            value={profile.logo_url || ''}
            onChange={handleChange}
            placeholder="https://example.com/logo.png"
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

        {/* Contact & Location */}
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
          Contact & Location
        </h3>
        <div className="pf-grid-2">
          <div className="pf-field">
            <label className="pf-label"><Phone size={12} style={{ display: 'inline', marginRight: 4 }} /> Phone Number</label>
            <input
              type="tel"
              name="phone"
              className="pf-input"
              value={profile.phone || ''}
              onChange={handleChange}
              placeholder="+254 700 000000"
            />
          </div>
          <div className="pf-field">
            <label className="pf-label"><Mail size={12} style={{ display: 'inline', marginRight: 4 }} /> Official Email</label>
            <input
              type="email"
              name="email"
              className="pf-input"
              value={profile.email || ''}
              onChange={handleChange}
              placeholder="admin@school.ac.ke"
            />
          </div>
        </div>

        <div className="pf-grid-2">
          <div className="pf-field">
            <label className="pf-label"><Globe size={12} style={{ display: 'inline', marginRight: 4 }} /> Website</label>
            <input
              type="url"
              name="website"
              className="pf-input"
              value={profile.website || ''}
              onChange={handleChange}
              placeholder="https://myschool.ac.ke"
            />
          </div>
          <div className="pf-field">
            <label className="pf-label"><Building size={12} style={{ display: 'inline', marginRight: 4 }} /> City / Region</label>
            <input
              type="text"
              name="city"
              className="pf-input"
              value={profile.city || ''}
              onChange={handleChange}
              placeholder="e.g. Nairobi"
            />
          </div>
        </div>

        <div className="pf-grid-2">
          <div className="pf-field">
            <label className="pf-label">Country</label>
            <input
              type="text"
              name="country"
              className="pf-input"
              value={profile.country || 'Kenya'}
              onChange={handleChange}
            />
          </div>
          <div className="pf-field">
            <label className="pf-label">Operating Currency</label>
            <select
              name="currency"
              className="pf-select"
              value={profile.currency || 'KES'}
              onChange={handleChange}
            >
              {['KES', 'USD', 'GBP', 'EUR', 'TZS', 'UGX', 'ETB'].map((cur) => (
                <option key={cur} value={cur}>{cur}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pf-field">
          <label className="pf-label">Physical Address</label>
          <input
            type="text"
            name="address"
            className="pf-input"
            value={profile.address || ''}
            onChange={handleChange}
            placeholder="P.O. Box or Street address"
          />
        </div>

        <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="btn-prim"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.5rem' }}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
