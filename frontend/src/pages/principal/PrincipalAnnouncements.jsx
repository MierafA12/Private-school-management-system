import { useEffect, useState, useMemo } from 'react';
import {
  Send, Trash2, Megaphone, Plus, X,
  Clock, CheckCircle2, AlertTriangle, Users, Search,
} from 'lucide-react';
import { principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';
import './principal.css';

export default function PrincipalAnnouncements() {
  const [announcements,    setAnnouncements]    = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [submitting,       setSubmitting]       = useState(false);
  const [showCompose,      setShowCompose]      = useState(false);
  const [filterAudience,   setFilterAudience]   = useState('ALL');
  const [searchQuery,      setSearchQuery]      = useState('');
  const [successMsg,       setSuccessMsg]       = useState('');

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    audience: 'ALL',
    priority: 'NORMAL',
  });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
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
      setSuccessMsg('Announcement deleted.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      if (filterAudience !== 'ALL' && a.audience !== filterAudience) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.title?.toLowerCase().includes(q);
        const matchBody = a.body?.toLowerCase().includes(q);
        if (!matchTitle && !matchBody) return false;
      }
      return true;
    });
  }, [announcements, filterAudience, searchQuery]);

  // Metric stats
  const totalCount = announcements.length;
  const urgentCount = announcements.filter((a) => a.priority === 'URGENT' || a.priority === 'HIGH').length;
  const allAudienceCount = announcements.filter((a) => a.audience === 'ALL').length;
  const targetedCount = totalCount - allAudienceCount;

  if (loading) return <LoadingSpinner message="Loading school announcements…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="sp-page-header">
        <div>
          <h1 className="sp-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Megaphone size={22} style={{ color: 'var(--primary, #991B1B)' }} />
            Broadcasts & Announcements
          </h1>
          <p className="sp-page-sub">
            Publish official notices to students, parents, faculty, or the entire school body
          </p>
        </div>
        <button
          type="button"
          className="btn-prim"
          onClick={() => setShowCompose((prev) => !prev)}
        >
          {showCompose ? <X size={15} /> : <Plus size={15} />}
          <span>{showCompose ? 'Close Composer' : 'New Announcement'}</span>
        </button>
      </div>

      {successMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 0.9rem',
            borderRadius: 6,
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            color: '#166534',
            marginBottom: '1.25rem',
            fontSize: '0.8125rem',
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={16} color="#16A34A" />
          {successMsg}
        </div>
      )}

      {/* ── Metrics Grid ── */}
      <div className="sp-stats-grid">
        <div className="sp-stat-card">
          <div className="sp-stat-header">
            <span className="sp-stat-label">Total Broadcasts</span>
            <span className="sp-stat-icon"><Megaphone size={16} /></span>
          </div>
          <div className="sp-stat-value">{totalCount}</div>
          <div className="sp-stat-sub">Active notices published</div>
        </div>

        <div className="sp-stat-card">
          <div className="sp-stat-header">
            <span className="sp-stat-label">Urgent / High Priority</span>
            <span className="sp-stat-icon"><AlertTriangle size={16} /></span>
          </div>
          <div className="sp-stat-value">{urgentCount}</div>
          <div className="sp-stat-sub">Priority alerts flagged</div>
        </div>

        <div className="sp-stat-card">
          <div className="sp-stat-header">
            <span className="sp-stat-label">Targeted Notices</span>
            <span className="sp-stat-icon"><Users size={16} /></span>
          </div>
          <div className="sp-stat-value">{targetedCount}</div>
          <div className="sp-stat-sub">Parents, staff, or students</div>
        </div>
      </div>

      {/* ── Collapsible Composer Card ── */}
      {showCompose && (
        <div className="sp-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <div className="pc-section-title">
            <Megaphone size={15} />
            Compose New Announcement
          </div>
          <form onSubmit={handleSubmit}>
            <div className="pf-field">
              <label className="pf-label">Headline / Title <span>*</span></label>
              <input
                type="text"
                required
                className="pf-input"
                placeholder="e.g. End of Semester Examination Schedule & Early Dismissal"
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
                  <option value="ALL">Entire School (Students, Parents, Staff)</option>
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
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94A3B8)' }}>
                  {formData.body.length} characters
                </span>
              </div>
              <textarea
                required
                className="pf-input"
                rows={5}
                placeholder="Detail the announcement, effective dates, instructions, or next steps..."
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                style={{ resize: 'vertical', minHeight: 110 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.25rem' }}>
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
                <Send size={15} />
                <span>{submitting ? 'Publishing…' : 'Publish Announcement'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filter Toolbar & Audience Pills ── */}
      <div className="sp-filter-toolbar">
        <div className="sp-filter-group">
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
                className={`sp-pill-btn ${active ? 'sp-pill-btn--active' : ''}`}
                onClick={() => setFilterAudience(val)}
              >
                {label}
              </button>
            );
          })}

          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '0.25rem' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, color: '#94A3B8', pointerEvents: 'none' }} />
            <input
              type="text"
              className="pf-input"
              style={{ paddingLeft: '2rem', width: 210, height: 34 }}
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748B)' }}>
          Showing {filteredAnnouncements.length} of {announcements.length} announcements
        </span>
      </div>

      {/* ── Announcement Feed ── */}
      {filteredAnnouncements.length === 0 ? (
        <div className="sp-card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <Megaphone size={36} style={{ color: '#CBD5E1', margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main, #0F172A)', margin: '0 0 0.25rem 0' }}>
            No Announcements Found
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748B)', margin: '0 0 1rem 0' }}>
            {searchQuery || filterAudience !== 'ALL'
              ? 'No announcements match your search or audience filter.'
              : 'There are currently no active school broadcasts.'}
          </p>
          <button
            type="button"
            className="btn-prim"
            onClick={() => setShowCompose(true)}
            style={{ margin: '0 auto' }}
          >
            <Plus size={14} /> Create First Announcement
          </button>
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="announcement-meta">
                    <span className={`sp-badge sp-badge--${badgeColor}`} style={{ fontWeight: 600 }}>
                      {a.priority || 'NORMAL'}
                    </span>
                    <span className="sp-badge sp-badge--gray" style={{ fontWeight: 500 }}>
                      To: {a.audience}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94A3B8)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      {pubDate}
                    </span>
                  </div>

                  <h3 className="announcement-title">
                    {a.title}
                  </h3>

                  <p className="announcement-body">
                    {a.body}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  className="btn-danger"
                  title="Delete Announcement"
                  style={{ flexShrink: 0 }}
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

