import { useEffect, useState } from 'react';
import {
  Send, Trash2, Megaphone, Plus, X,
  Clock, CheckCircle2,
} from 'lucide-react';
import { principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';
import './principal.css';

export default function PrincipalAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [showCompose,   setShowCompose]   = useState(false);
  const [filterAudience, setFilterAudience] = useState('ALL');
  const [successMsg,    setSuccessMsg]    = useState('');

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    audience: 'ALL',
    priority: 'NORMAL',
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await principalApi.getAnnouncements();
      setAnnouncements(Array.isArray(res) ? res : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await principalApi.createAnnouncement(formData);
      setFormData({ title: '', body: '', audience: 'ALL', priority: 'NORMAL' });
      setShowCompose(false);
      setSuccessMsg('Announcement published successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) return;
    try {
      await principalApi.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <LoadingSpinner message="Loading school announcements…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  const filteredAnnouncements = announcements.filter((a) => {
    if (filterAudience === 'ALL') return true;
    return a.audience === filterAudience;
  });

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>
      {/* ── Page Header ── */}
      <div className="sp-page-header" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="sp-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Megaphone size={26} style={{ color: 'var(--primary, #991B1B)' }} />
              School Broadcasts & Announcements
            </h1>
            <p className="sp-page-sub">
              Publish official notices to students, parents, faculty, or the entire school body.
            </p>
          </div>
          <button
            type="button"
            className="btn-prim"
            onClick={() => setShowCompose((prev) => !prev)}
          >
            {showCompose ? <X size={14} /> : <Plus size={14} />}
            <span>{showCompose ? 'Close' : 'New Announcement'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
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
            fontWeight: 500,
            fontSize: '0.8125rem',
          }}
        >
          <CheckCircle2 size={16} color="#16A34A" />
          {successMsg}
        </div>
      )}

      {/* ── Collapsible Composer Card ── */}
      {showCompose && (
        <div className="sp-card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
          <div className="pc-section-title">
            <Megaphone size={15} />
            Compose Announcement
          </div>
          <form onSubmit={handleSubmit}>
            <div className="pf-field">
              <label className="pf-label">Title / Headline <span>*</span></label>
              <input
                type="text"
                required
                className="pf-input"
                placeholder="e.g. End of Term Examination Schedule & Early Dismissal"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="pf-grid-2">
              <div className="pf-field">
                <label className="pf-label">Target Audience <span>*</span></label>
                <select
                  className="pf-select"
                  value={formData.audience}
                  onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                >
                  <option value="ALL">Entire School (Students, Parents, Teachers & Staff)</option>
                  <option value="PARENTS">Parents / Guardians Only</option>
                  <option value="TEACHERS">Faculty / Teachers Only</option>
                  <option value="STUDENTS">Students Only</option>
                </select>
              </div>

              <div className="pf-field">
                <label className="pf-label">Priority Level <span>*</span></label>
                <select
                  className="pf-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="NORMAL">Normal Notice</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent Alert (Highlighted)</option>
                  <option value="LOW">Low / Informational</option>
                </select>
              </div>
            </div>

            <div className="pf-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="pf-label">Announcement Content <span>*</span></label>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  {formData.body.length} characters
                </span>
              </div>
              <textarea
                required
                className="pf-input"
                rows={5}
                placeholder="Detail the announcement, effective dates, requirements, or next steps..."
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                style={{ resize: 'vertical', minHeight: 110 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowCompose(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-prim"
              >
                <Send size={16} />
                <span>{submitting ? 'Publishing Broadcast…' : 'Publish Announcement'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Audience Filter Pills & Counter ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            ['ALL', 'All Broadcasts'],
            ['PARENTS', 'Parents'],
            ['TEACHERS', 'Teachers'],
            ['STUDENTS', 'Students'],
          ].map(([val, label]) => {
            const active = filterAudience === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => setFilterAudience(val)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 6,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  border: '1px solid',
                  borderColor: active ? 'var(--primary, #991B1B)' : '#CBD5E1',
                  background: active ? '#FEF2F2' : '#FFFFFF',
                  color: active ? 'var(--primary, #991B1B)' : '#475569',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
          Showing {filteredAnnouncements.length} of {announcements.length} announcements
        </span>
      </div>

      {/* ── Announcement Feed ── */}
      {filteredAnnouncements.length === 0 ? (
        <div className="sp-card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
          <Megaphone size={32} style={{ color: '#CBD5E1', margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A', margin: '0 0 0.25rem 0' }}>
            No Announcements Found
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>
            {filterAudience === 'ALL'
              ? 'Click "New Announcement" above to broadcast your first message.'
              : `There are currently no announcements targeted to ${filterAudience.toLowerCase()}.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredAnnouncements.map((a) => {
            const pubDate = a.publish_at
              ? new Date(a.publish_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recently';

            const badgeColor =
              a.priority === 'URGENT' ? 'red' :
              a.priority === 'HIGH'   ? 'yellow' :
              a.priority === 'LOW'    ? 'gray' : 'blue';

            return (
              <div
                key={a.id}
                className={`announcement-card announcement-card--${a.priority || 'NORMAL'}`}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                    <span
                      className={`sp-badge sp-badge--${badgeColor}`}
                      style={{ fontWeight: 500, fontSize: '0.72rem' }}
                    >
                      {a.priority || 'NORMAL'}
                    </span>
                    <span
                      className="sp-badge sp-badge--gray"
                      style={{ fontWeight: 500, fontSize: '0.72rem' }}
                    >
                      To: {a.audience}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={11} />
                      {pubDate}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: '#0F172A',
                      margin: '0 0 0.35rem 0',
                      lineHeight: 1.3,
                    }}
                  >
                    {a.title}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: '#475569',
                      fontSize: '0.8125rem',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {a.body}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  className="btn-danger"
                  title="Delete Announcement"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
