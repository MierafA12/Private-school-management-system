import { useState, useEffect } from 'react';
import { Save, Edit3, CheckCircle2 } from 'lucide-react';
import { teacherApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';

export default function TeacherGrades() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
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

  const fetchExams = async () => {
    if (!selectedClass || !selectedSection || !selectedSubject) return;
    setLoadingExams(true);
    setStudents([]);
    setSelectedExam(null);
    try {
      const data = await teacherApi.getExams(selectedClass, selectedSection, selectedSubject);
      setExams(data || []);
    } catch (err) {
      alert(err.message || 'Failed to load exams');
    } finally {
      setLoadingExams(false);
    }
  };

  const fetchExamResults = async (exam) => {
    setSelectedExam(exam);
    setLoadingStudents(true);
    setSuccessMsg('');
    try {
      const data = await teacherApi.getExamResults(exam.exam_schedule_id);
      setStudents(data || []);
    } catch (err) {
      alert(err.message || 'Failed to load results');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleResultChange = (studentId, field, value) => {
    setStudents(students.map(s => s.student_id === studentId ? { ...s, [field]: value } : s));
  };

  const submitGrades = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      await teacherApi.submitGrades(selectedExam.exam_schedule_id, students);
      setSuccessMsg('Grades saved successfully!');
    } catch (err) {
      alert(err.message || 'Failed to save grades');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading classes..." />;
  if (error) return <ErrorBanner message={error} onRetry={fetchClasses} />;

  const uniqueClasses = Array.from(new Set(classes.map(c => c.class_id)))
    .map(id => classes.find(c => c.class_id === id))
    .filter(Boolean);

  const availableSections = classes.filter(c => c.class_id === selectedClass);
  const availableSubjects = availableSections.filter(s => s.section_id === selectedSection);

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Student Grades</h1>
        <p className="sp-page-sub">Enter and manage exam marks and term assessment grades</p>
      </div>

      {/* Selectors */}
      <section className="sp-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div className="tp-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', alignItems: 'end', gap: '1rem' }}>
          <div className="tp-form-group">
            <label>Class</label>
            <select
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(''); setSelectedSubject(''); setExams([]); setSelectedExam(null); }}
            >
              <option value="">Select Class</option>
              {uniqueClasses.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)}
            </select>
          </div>

          <div className="tp-form-group">
            <label>Section</label>
            <select
              value={selectedSection}
              onChange={(e) => { setSelectedSection(e.target.value); setSelectedSubject(''); setExams([]); setSelectedExam(null); }}
              disabled={!selectedClass}
            >
              <option value="">Select Section</option>
              {Array.from(new Set(availableSections.map(s => s.section_id))).map(id => {
                const s = availableSections.find(x => x.section_id === id);
                return <option key={s.section_id} value={s.section_id}>{s.section_name}</option>;
              })}
            </select>
          </div>

          <div className="tp-form-group">
            <label>Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => { setSelectedSubject(e.target.value); setExams([]); setSelectedExam(null); }}
              disabled={!selectedSection}
            >
              <option value="">Select Subject</option>
              {availableSubjects.map(s => (
                <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>
              ))}
            </select>
          </div>

          <div>
            <button
              className="tp-btn-primary"
              onClick={fetchExams}
              disabled={!selectedClass || !selectedSection || !selectedSubject || loadingExams}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loadingExams ? 'Searching...' : 'Find Exams'}
            </button>
          </div>
        </div>
      </section>

      {/* Scheduled Exams List */}
      {exams.length > 0 && !selectedExam && (
        <section className="sp-card" style={{ marginBottom: '1.5rem' }}>
          <div className="sp-card-header">
            <h2 className="sp-card-title">Scheduled Exams</h2>
          </div>
          <div className="sp-card-body" style={{ padding: 0 }}>
            <div className="tp-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="tp-table">
                <thead>
                  <tr>
                    <th>Term / Year</th>
                    <th>Exam Type</th>
                    <th>Date</th>
                    <th>Max Marks</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map(e => (
                    <tr key={e.exam_schedule_id}>
                      <td><strong>{e.term_name || 'Term'}</strong> ({e.year_name || 'Academic Year'})</td>
                      <td>{e.exam_type}</td>
                      <td>{e.exam_date ? new Date(e.exam_date).toLocaleDateString() : '—'}</td>
                      <td>{e.max_marks || 100}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="tp-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => fetchExamResults(e)}>
                          <Edit3 size={14} style={{ display: 'inline', marginRight: '4px' }} /> Enter Grades
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Grades Input Table */}
      {selectedExam && (
        <section className="sp-card">
          <div className="sp-card-header">
            <div>
              <h2 className="sp-card-title">Grades for {selectedExam.exam_type}</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Max Marks: {selectedExam.max_marks || 100}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {successMsg && (
                <span style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem' }}>
                  <CheckCircle2 size={16} /> {successMsg}
                </span>
              )}
              <button className="tp-btn-primary" onClick={submitGrades} disabled={saving}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save Grades'}
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
                    <th style={{ width: '130px' }}>Marks</th>
                    <th style={{ width: '110px' }}>Grade</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStudents ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}><LoadingSpinner message="Loading students..." /></td></tr>
                  ) : students.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No students found in this class section.</td></tr>
                  ) : students.map(s => (
                    <tr key={s.student_id}>
                      <td><strong>{s.admission_number || '—'}</strong></td>
                      <td>{s.last_name ? `${s.last_name}, ${s.first_name}` : (s.first_name || 'Student')}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max={selectedExam.max_marks || 100}
                          value={s.marks_obtained ?? ''}
                          onChange={(e) => handleResultChange(s.student_id, 'marks_obtained', e.target.value)}
                          style={{
                            padding: '0.45rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)',
                            width: '100%',
                            fontSize: '0.85rem'
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          maxLength="3"
                          value={s.grade || ''}
                          onChange={(e) => handleResultChange(s.student_id, 'grade', e.target.value.toUpperCase())}
                          placeholder="A/B/C"
                          style={{
                            padding: '0.45rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)',
                            width: '100%',
                            fontSize: '0.85rem',
                            textTransform: 'uppercase'
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={s.teacher_remarks || ''}
                          onChange={(e) => handleResultChange(s.student_id, 'teacher_remarks', e.target.value)}
                          placeholder="Optional comments..."
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

      {exams.length === 0 && !loadingExams && (
        <section className="sp-card">
          <div style={{ padding: '2.5rem' }}>
            <EmptyState
              icon="📝"
              title={selectedClass && selectedSubject ? "No Exams Found" : "Select Class & Subject"}
              subtitle={selectedClass && selectedSubject ? "No exams are currently scheduled for this subject." : "Choose your class, section, and subject above to view and enter grades."}
            />
          </div>
        </section>
      )}
    </div>
  );
}
