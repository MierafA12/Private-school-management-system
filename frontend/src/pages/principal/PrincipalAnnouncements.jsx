import { useEffect, useState } from 'react';
import { Send, Trash2, Megaphone } from 'lucide-react';
import { principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';

export default function PrincipalAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    audience: 'ALL',
    priority: 'NORMAL'
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await principalApi.getAnnouncements();
      setAnnouncements(res);
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
      await load(); // refresh list
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await principalApi.deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <LoadingSpinner message="Loading announcements…" />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;

  return (
    <div className="principal-announcements">
      <div className="sp-page-header">
        <h1 className="sp-page-title">Announcements</h1>
        <p className="sp-page-sub">Broadcast messages to the entire school or specific groups</p>
      </div>

      <div className="sp-card" style={{ marginBottom: '2rem' }}>
        <div className="sp-card-header">
          <span className="sp-card-title"><Megaphone size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Create Announcement</span>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="auth-label">Title</label>
            <input 
              type="text" 
              required 
              className="auth-input" 
              placeholder="E.g. School closed for public holiday"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="auth-label">Message</label>
            <textarea 
              required 
              className="auth-input" 
              rows={4}
              placeholder="Write your announcement here..."
              value={formData.body}
              onChange={e => setFormData({ ...formData, body: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="auth-label">Audience</label>
              <select className="auth-input" value={formData.audience} onChange={e => setFormData({ ...formData, audience: e.target.value })}>
                <option value="ALL">All School (Staff, Teachers, Parents, Students)</option>
                <option value="PARENTS">Parents Only</option>
                <option value="TEACHERS">Teachers Only</option>
                <option value="STUDENTS">Students Only</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="auth-label">Priority</label>
              <select className="auth-input" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={submitting} className="auth-btn" style={{ alignSelf: 'flex-start', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={16} />
            {submitting ? 'Publishing...' : 'Publish Announcement'}
          </button>
        </form>
      </div>

      <div className="sp-card">
        <div className="sp-card-header">
          <span className="sp-card-title">Recent Announcements</span>
        </div>
        {announcements.length === 0 ? (
          <div className="sp-empty">No announcements published yet.</div>
        ) : (
          <div style={{ padding: '1rem' }}>
            {announcements.map(a => (
              <div key={a.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {a.title}
                    <span className={`sp-badge sp-badge--${a.priority === 'URGENT' ? 'red' : a.priority === 'HIGH' ? 'yellow' : 'blue'}`}>
                      {a.priority}
                    </span>
                    <span className="sp-badge" style={{ backgroundColor: '#e2e8f0', color: '#475569' }}>
                      To: {a.audience}
                    </span>
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.9rem' }}>{a.body}</p>
                  <small style={{ color: '#94a3b8', display: 'block', marginTop: '0.5rem' }}>
                    Published on {new Date(a.publish_at).toLocaleDateString()}
                  </small>
                </div>
                <button 
                  onClick={() => handleDelete(a.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.5rem' }}
                  title="Delete Announcement"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
