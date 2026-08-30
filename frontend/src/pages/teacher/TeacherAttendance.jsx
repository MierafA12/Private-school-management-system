import { useState, useEffect } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { teacherApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';

export default function TeacherAttendance() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teacherApi.getClasses();
      setClasses(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchAttendance = async () => {
    if (!selectedClass || !selectedSection || !date) return;
    setLoadingRecords(true);
    setSuccessMsg('');
    try {
      const data = await teacherApi.getAttendance(selectedClass, selectedSection, date);
      setRecords(data.records || data || []);
    } catch (err) {
      alert(err.message || 'Failed to load attendance');
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setRecords(records.map(r => r.student_id === studentId ? { ...r, attendance_status: status } : r));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setRecords(records.map(r => r.student_id === studentId ? { ...r, remarks } : r));
  };

  const submitAttendance = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      await teacherApi.submitAttendance({
        classId: selectedClass,
        sectionId: selectedSection,
        date,
        records
      });
      setSuccessMsg('Attendance saved successfully!');
    } catch (err) {
      alert(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading attendance roster..." />;
  if (error) return <ErrorBanner message={error} onRetry={fetchClasses} />;

  // Unique classes for the dropdown
  const uniqueClasses = Array.from(new Set(classes.map(c => c.class_id)))
    .map(id => classes.find(c => c.class_id === id))
    .filter(Boolean);

  const availableSections = classes.filter(c => c.class_id === selectedClass);

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Class Attendance</h1>
        <p className="sp-page-sub">Record and submit daily attendance for your students</p>
      </div>

      {/* Filter / Selector Bar */}
      <section className="sp-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div className="tp-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', alignItems: 'end', gap: '1rem' }}>
          <div className="tp-form-group">
            <label>Class</label>
            <select
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(''); setRecords([]); }}
            >
              <option value="">Select Class</option>
              {uniqueClasses.map(c => (
                <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
              ))}
            </select>
          </div>

          <div className="tp-form-group">
            <label>Section</label>
            <select
              value={selectedSection}
              onChange={(e) => { setSelectedSection(e.target.value); setRecords([]); }}
              disabled={!selectedClass}
            >
              <option value="">Select Section</option>
              {availableSections.map(s => (
                <option key={s.section_id} value={s.section_id}>{s.section_name}</option>
              ))}
            </select>
          </div>

          <div className="tp-form-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <button
              className="tp-btn-primary"
              onClick={fetchAttendance}
              disabled={!selectedClass || !selectedSection || !date || loadingRecords}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loadingRecords ? 'Loading...' : 'Load Students'}
            </button>
          </div>
        </div>
      </section>

      {/* Attendance Roster Table */}
      {records.length > 0 && (
        <section className="sp-card">
          <div className="sp-card-header">
            <h2 className="sp-card-title">Students Roster ({records.length})</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {successMsg && (
                <span style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem' }}>
                  <CheckCircle2 size={16} /> {successMsg}
                </span>
              )}
              <button className="tp-btn-primary" onClick={submitAttendance} disabled={saving}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
          
          <div className="sp-card-body" style={{ padding: 0 }}>
            <div className="tp-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="tp-table">
                <thead>
                  <tr>
                    <th>Admission No.</th>
                    <th>Student Name</th>
                    <th style={{ width: '160px' }}>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.student_id}>
                      <td><strong>{r.admission_number || '—'}</strong></td>
                      <td>{r.last_name ? `${r.last_name}, ${r.first_name}` : (r.first_name || 'Student')}</td>
                      <td>
                        <select
                          className={`tp-status-select ${
                            r.attendance_status === 'Present' ? 'tp-status-present'
                            : r.attendance_status === 'Absent' ? 'tp-status-absent'
                            : r.attendance_status === 'Late' ? 'tp-status-late' : ''
                          }`}
                          value={r.attendance_status || 'Present'}
                          onChange={(e) => handleStatusChange(r.student_id, e.target.value)}
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Late">Late</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Optional notes..."
                          value={r.remarks || ''}
                          onChange={(e) => handleRemarksChange(r.student_id, e.target.value)}
                          style={{
                            padding: '0.45rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)',
                            width: '100%',
                            fontSize: '0.85rem'
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {records.length === 0 && !loadingRecords && (
        <section className="sp-card">
          <div style={{ padding: '2.5rem' }}>
            <EmptyState
              icon="📋"
              title={selectedClass && selectedSection ? "No Students Found" : "Select Class & Section"}
              subtitle={selectedClass && selectedSection ? "There are no active students enrolled in this section." : "Choose your class, section, and date above to load the student roster."}
            />
          </div>
        </section>
      )}
    </div>
  );
}
