import { useState, useEffect } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import { teacherApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';

const STATUS_OPTIONS = ['Present', 'Absent', 'Late', 'Excused', 'Permission'];
const STATUS_COLOR   = { Present: '#16A34A', Absent: '#B91C1C', Late: '#D97706', Excused: '#2563EB', Permission: '#7C3AED' };

const inputSt = {
  padding: '0.55rem 0.875rem', border: '1px solid var(--border-color)',
  borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit',
  color: 'var(--text-main)', background: 'white', width: '100%', outline: 'none',
};

export default function TeacherAttendance() {
  const [classes,  setClasses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const [classId,   setClassId]   = useState('');
  const [sectionId, setSectionId] = useState('');
  const [date,      setDate]      = useState(new Date().toISOString().split('T')[0]);

  const [records,      setRecords]      = useState([]);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);

  const load = async () => {
    try { setLoading(true); setError(null); setClasses(await teacherApi.getClasses() || []); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const loadSheet = async () => {
    if (!classId || !sectionId || !date) return;
    setLoadingSheet(true); setSaved(false);
    try {
      const data = await teacherApi.getAttendance(classId, sectionId, date);
      setRecords(data.records || data || []);
    } catch (err) { alert(err.message); }
    finally { setLoadingSheet(false); }
  };

  const setStatus = (studentId, status) =>
    setRecords(r => r.map(x => x.student_id === studentId ? { ...x, attendance_status: status } : x));

  const setRemarks = (studentId, remarks) =>
    setRecords(r => r.map(x => x.student_id === studentId ? { ...x, remarks } : x));

  const markAll = (status) =>
    setRecords(r => r.map(x => ({ ...x, attendance_status: status })));

  const submit = async () => {
    setSaving(true); setSaved(false);
    try {
      await teacherApi.submitAttendance({ classId, sectionId, date, records });
      setSaved(true);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  // Build unique class / section lists
  const uniqueClasses = [...new Map(classes.map(c => [c.class_id, c])).values()];
  const sections      = classes.filter(c => c.class_id === classId);
  const present       = records.filter(r => r.attendance_status === 'Present').length;

  if (loading) return <LoadingSpinner message="Loading your classes…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Attendance</h1>
        <p className="sp-page-sub">Take daily attendance for your assigned classes</p>
      </div>

      {/* Selector */}
      <div className="sp-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Class</label>
            <select style={inputSt} value={classId} onChange={e => { setClassId(e.target.value); setSectionId(''); setRecords([]); }}>
              <option value="">— Select Class —</option>
              {uniqueClasses.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Section</label>
            <select style={inputSt} value={sectionId} onChange={e => { setSectionId(e.target.value); setRecords([]); }} disabled={!classId}>
              <option value="">— Select Section —</option>
              {sections.map(s => <option key={s.section_id} value={s.section_id}>Section {s.section_name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Date</label>
            <input type="date" style={inputSt} value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <button
              onClick={loadSheet}
              disabled={!classId || !sectionId || !date || loadingSheet}
              style={{ ...inputSt, background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: 'pointer', border: 'none' }}>
              {loadingSheet ? 'Loading…' : 'Load Students'}
            </button>
          </div>
        </div>
      </div>

      {/* Roster */}
      {records.length > 0 && (
        <div className="sp-card">
          <div className="sp-card-header">
            <span className="sp-card-title">
              Students — {records.length} total
              <span style={{ marginLeft: '0.5rem', color: '#16A34A', fontWeight: 700 }}>{present} present</span>
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Quick mark all */}
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button onClick={() => markAll('Present')}
                  style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#15803D', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                  All Present
                </button>
                <button onClick={() => markAll('Absent')}
                  style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                  All Absent
                </button>
              </div>
              {saved && (
                <span style={{ color: '#16A34A', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle size={15} /> Saved
                </span>
              )}
              <button onClick={submit} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                <Save size={15} /> {saving ? 'Saving…' : 'Save Attendance'}
              </button>
            </div>
          </div>

          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr><th>#</th><th>Student</th><th>Adm #</th><th>Status</th><th>Remarks</th></tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.student_id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{r.first_name} {r.last_name}</td>
                    <td style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{r.admission_number || '—'}</td>
                    <td>
                      <select
                        value={r.attendance_status || 'Present'}
                        onChange={e => setStatus(r.student_id, e.target.value)}
                        style={{
                          padding: '0.35rem 0.6rem', borderRadius: 6, fontSize: '0.82rem', fontWeight: 600,
                          border: '1px solid var(--border-color)',
                          color: STATUS_COLOR[r.attendance_status] || '#374151',
                          cursor: 'pointer', outline: 'none',
                        }}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={r.remarks || ''}
                        onChange={e => setRemarks(r.student_id, e.target.value)}
                        placeholder="Optional note…"
                        style={{ padding: '0.35rem 0.6rem', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.82rem', width: '100%', fontFamily: 'inherit' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!records.length && !loadingSheet && classId && sectionId && (
        <div className="sp-card">
          <EmptyState icon="📋"
            title={classId && sectionId ? 'No students found' : 'Select class and section'}
            subtitle={classId && sectionId ? 'No active students enrolled in this section.' : 'Choose your class, section and date, then click Load Students.'} />
        </div>
      )}
    </div>
  );
}
