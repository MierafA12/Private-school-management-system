import { useState, useEffect } from 'react';
import { CheckSquare, Save } from 'lucide-react';
import api from '../../api';
import { LoadingSpinner, ErrorState } from '../../components/shared/PageState';

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

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data } = await api.get('/teacher/classes');
        setClasses(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load classes');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const fetchAttendance = async () => {
    if (!selectedClass || !selectedSection || !date) return;
    setLoadingRecords(true);
    setSuccessMsg('');
    try {
      const { data } = await api.get('/teacher/attendance', {
        params: { classId: selectedClass, sectionId: selectedSection, date }
      });
      setRecords(data.data.records);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load attendance');
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
      await api.post('/teacher/attendance', {
        classId: selectedClass,
        sectionId: selectedSection,
        date,
        records
      });
      setSuccessMsg('Attendance saved successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  // Unique classes for the dropdown
  const uniqueClasses = Array.from(new Set(classes.map(c => c.class_id)))
    .map(id => classes.find(c => c.class_id === id));

  const availableSections = classes.filter(c => c.class_id === selectedClass);

  return (
    <div className="sp-page">
      <header className="sp-header">
        <div className="sp-header-titles">
          <h1 className="sp-title">Class Attendance</h1>
          <p className="sp-subtitle">Record daily attendance for your classes</p>
        </div>
      </header>

      <section className="sp-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div className="tp-form-grid" style={{ alignItems: 'end' }}>
          <div className="tp-form-group">
            <label>Class</label>
            <select
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(''); }}
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
              onChange={(e) => setSelectedSection(e.target.value)}
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
          <button
            className="tp-btn-primary"
            onClick={fetchAttendance}
            disabled={!selectedClass || !selectedSection || !date || loadingRecords}
          >
            {loadingRecords ? 'Loading...' : 'Load Roster'}
          </button>
        </div>
      </section>

      {records.length > 0 && (
        <section className="sp-card" style={{ padding: '1.5rem' }}>
          <div className="sp-card-header" style={{ borderBottom: 'none', padding: 0, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="sp-card-title">Students ({records.length})</h2>
            {successMsg && <span style={{ color: '#059669', fontWeight: 600 }}>{successMsg}</span>}
            <button className="tp-btn-primary" onClick={submitAttendance} disabled={saving}>
              <Save size={18} /> {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
          
          <div className="tp-table-wrapper">
            <table className="tp-table">
              <thead>
                <tr>
                  <th>Admission No.</th>
                  <th>Student Name</th>
                  <th>Status</th>
                  <th>Remarks (Optional)</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.student_id}>
                    <td>{r.admission_number}</td>
                    <td>{r.last_name}, {r.first_name}</td>
                    <td>
                      <select
                        className={`tp-status-select ${
                          r.attendance_status === 'Present' ? 'tp-status-present'
                          : r.attendance_status === 'Absent' ? 'tp-status-absent'
                          : r.attendance_status === 'Late' ? 'tp-status-late' : ''
                        }`}
                        value={r.attendance_status}
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
                        placeholder="e.g. Doctor's note"
                        value={r.remarks || ''}
                        onChange={(e) => handleRemarksChange(r.student_id, e.target.value)}
                        style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', width: '100%' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {records.length === 0 && !loadingRecords && selectedClass && selectedSection && (
        <div className="sp-empty-state">
          <CheckSquare size={48} />
          <h3>No Students Found</h3>
          <p>There are no active students in this class/section.</p>
        </div>
      )}
    </div>
  );
}
