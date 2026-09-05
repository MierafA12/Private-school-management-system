import { useEffect, useState } from 'react';
import { Save, School } from 'lucide-react';
import { principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';
import './principal.css';

const Field = ({ label, required, children }) => (
  <div className="pf-field">
    <label className="pf-label">{label}{required && <span> *</span>}</label>
    {children}
  </div>
);

export default function SchoolProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '', motto: '', address: '', city: '', country: 'Kenya',
    phone: '', email: '', website: '', registration_number: '',
    principal_name: '', currency: 'KES',
    academic_year_start_month: 1, terms_per_year: 3,
  });

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const data = await principalApi.getSchoolProfile();
      if (data) {
        setProfile(data);
        setForm({
          name:                      data.name || '',
          motto:                     data.motto || '',
          address:                   data.address || '',
          city:                      data.city || '',
          country:                   data.country || 'Kenya',
          phone:                     data.phone || '',
          email:                     data.email || '',
          website:                   data.website || '',
          registration_number:       data.registration_number || '',
          principal_name:            data.principal_name || '',
          currency:                  data.currency || 'KES',
          academic_year_start_month: data.academic_year_start_month || 1,
          terms_per_year:            data.terms_per_year || 3,
        });
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(false);
    try {
      await principalApi.updateSchoolProfile(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  if (loading) return <LoadingSpinner message="Loading school profile…" />;

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">School Profile</h1>
        <p className="sp-page-sub">Configure your school's identity and system settings</p>
      </div>

      {error   && <div style={{ marginBottom: '1rem' }}><ErrorBanner message={error} /></div>}
      {success && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '0.75rem 1.25rem', marginBottom: '1rem', color: '#15803D', fontWeight: 600, fontSize: '0.875rem' }}>
          ✓ School profile saved successfully.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="sp-card" style={{ marginBottom: '1.25rem' }}>
          <div className="sp-card-header">
            <span className="sp-card-title"><School size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />School Identity</span>
          </div>
          <div className="rg-form-body">
            <div className="pf-grid-2">
              <Field label="School Name" required>
                <input className="pf-input" value={form.name} onChange={set('name')} placeholder="EduFlow Private School" required />
              </Field>
              <Field label="Motto / Tagline">
                <input className="pf-input" value={form.motto} onChange={set('motto')} placeholder="Excellence in Education" />
              </Field>
              <Field label="Registration Number">
                <input className="pf-input" value={form.registration_number} onChange={set('registration_number')} placeholder="MoE/2023/001" />
              </Field>
              <Field label="Principal Name">
                <input className="pf-input" value={form.principal_name} onChange={set('principal_name')} placeholder="Dr. Jane Smith" />
              </Field>
            </div>
          </div>
        </div>

        <div className="sp-card" style={{ marginBottom: '1.25rem' }}>
          <div className="sp-card-header">
            <span className="sp-card-title">📍 Contact & Location</span>
          </div>
          <div className="rg-form-body">
            <div className="pf-grid-2">
              <Field label="Phone">
                <input className="pf-input" value={form.phone} onChange={set('phone')} placeholder="+254 700 000 000" />
              </Field>
              <Field label="Email">
                <input type="email" className="pf-input" value={form.email} onChange={set('email')} placeholder="info@school.com" />
              </Field>
              <Field label="Website">
                <input className="pf-input" value={form.website} onChange={set('website')} placeholder="https://school.com" />
              </Field>
              <Field label="City">
                <input className="pf-input" value={form.city} onChange={set('city')} placeholder="Nairobi" />
              </Field>
              <Field label="Country">
                <input className="pf-input" value={form.country} onChange={set('country')} placeholder="Kenya" />
              </Field>
            </div>
            <Field label="Address">
              <textarea className="pf-input" rows={2} value={form.address} onChange={set('address')} placeholder="P.O. Box 1234, Nairobi" />
            </Field>
          </div>
        </div>

        <div className="sp-card" style={{ marginBottom: '1.25rem' }}>
          <div className="sp-card-header">
            <span className="sp-card-title">⚙️ Academic Settings</span>
          </div>
          <div className="rg-form-body">
            <div className="pf-grid-2">
              <Field label="Currency">
                <select className="pf-select" value={form.currency} onChange={set('currency')}>
                  {['KES','USD','GBP','EUR','TZS','UGX','ETB','NGN','ZAR'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Terms Per Year">
                <select className="pf-select" value={form.terms_per_year} onChange={set('terms_per_year')}>
                  <option value={2}>2 Terms</option>
                  <option value={3}>3 Terms</option>
                  <option value={4}>4 Terms</option>
                </select>
              </Field>
              <Field label="Academic Year Start Month">
                <select className="pf-select" value={form.academic_year_start_month} onChange={set('academic_year_start_month')}>
                  {['January','February','March','April','May','June','July','August','September','October','November','December']
                    .map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn-prim" disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem' }}>
            <Save size={16} /> {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
