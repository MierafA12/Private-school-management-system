import { useState, useEffect } from 'react';
import { FileText, Save, Edit3 } from 'lucide-react';
import api from '../../api';
import { LoadingSpinner, ErrorState } from '../../components/shared/PageState';

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

  const fetchExams = async () => {
    if (!selectedClass || !selectedSection || !selectedSubject) return;
    setLoadingExams(true);
    setStudents([]);
    setSelectedExam(null);
    try {
      const { data } = await api.get('/teacher/exams', {
        params: { classId: selectedClass, sectionId: selectedSection, subjectId: selectedSubject }
      });
      setExams(data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load exams');
    } finally {
      setLoadingExams(false);
    }
  };

  const fetchExamResults = async (exam) => {
    setSelectedExam(exam);
    setLoadingStudents(true);
    setSuccessMsg('');
    try {
      const { data } = await api.get(`/teacher/exams/${exam.exam_schedule_id}/results`);
      setStudents(data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load results');
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
      await api.post(`/teacher/exams/${selectedExam.exam_schedule_id}/results`, {
        results: students
      });
      setSuccessMsg('Grades saved successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save grades');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  const uniqueClasses = Array.from(new Set(classes.map(c => c.class_id)))
    .map(id => classes.find(c => c.class_id === id));
  const availableSections = classes.filter(c => c.class_id === selectedClass);
  const availableSubjects = availableSections.filter(s => s.section_id === selectedSection);

  return (
    <div className="sp-page">
      <header className="sp-header">
        <div className="sp-header-titles">
          <h1 className="sp-title">Student Grades</h1>
          <p className="sp-subtitle">Input and manage exam results</p>
        </div>
      </header>

      <section className="sp-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div className="tp-form-grid" style={{ alignItems: 'end', gridTemplateColumns: '1fr 1fr 1fr auto' }}>
          <div className="tp-form-group">
            <label>Class</label>
            <select
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(''); setSelectedSubject(''); setExams([]); }}
            >
              <option value="">Select Class</option>
              {uniqueClasses.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)}
            </select>
          </div>
          <div className="tp-form-group">
            <label>Section</label>
            <select
              value={selectedSection}
              onChange={(e) => { setSelectedSection(e.target.value); setSelectedSubject(''); setExams([]); }}
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
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedSection}
            >
              <option value="">Select Subject</option>
              {availableSubjects.map(s => (
                <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>
              ))}
            </select>
          </div>
          <button
            className="tp-btn-primary"
            onClick={fetchExams}
            disabled={!selectedClass || !selectedSection || !selectedSubject || loadingExams}
          >
            {loadingExams ? 'Searching...' : 'Find Exams'}
          </button>
        </div>
      </section>

      {exams.length > 0 && !selectedExam && (
        <section className="sp-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 className="sp-card-title" style={{ marginBottom: '1rem' }}>Scheduled Exams</h2>
          <div className="tp-table-wrapper">
            <table className="tp-table">
              <thead>
                <tr>
                  <th>Term/Year</th>
                  <th>Exam Type</th>
                  <th>Date</th>
                  <th>Max Marks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {exams.map(e => (
                  <tr key={e.exam_schedule_id}>
                    <td>{e.term_name} ({e.year_name})</td>
                    <td>{e.exam_type}</td>
                    <td>{new Date(e.exam_date).toLocaleDateString()}</td>
                    <td>{e.max_marks}</td>
                    <td>
                      <button className="tp-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => fetchExamResults(e)}>
                        <Edit3 size={14} style={{ display: 'inline', marginRight: '4px' }} /> Enter Grades
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedExam && (
        <section className="sp-card" style={{ padding: '1.5rem' }}>
          <div className="sp-card-header" style={{ borderBottom: 'none', padding: 0, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="sp-card-title">Grades for {selectedExam.exam_type}</h2>
              <p className="tp-kpi-sub" style={{ marginTop: '0.2rem' }}>Max Marks: {selectedExam.max_marks}</p>
            </div>
            {successMsg && <span style={{ color: '#059669', fontWeight: 600 }}>{successMsg}</span>}
            <button className="tp-btn-primary" onClick={submitGrades} disabled={saving}>
              <Save size={18} /> {saving ? 'Saving...' : 'Save Grades'}
            </button>
          </div>
          
          <div className="tp-table-wrapper">
            <table className="tp-table">
              <thead>
                <tr>
                  <th>Admission No.</th>
                  <th>Student Name</th>
                  <th style={{ width: '120px' }}>Marks</th>
                  <th style={{ width: '100px' }}>Grade</th>
                  <th>Remarks (Optional)</th>
                </tr>
              </thead>
              <tbody>
                {loadingStudents ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center' }}><LoadingSpinner /></td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center' }}>No students found in this class.</td></tr>
                ) : students.map(s => (
                  <tr key={s.student_id}>
                    <td>{s.admission_number}</td>
                    <td>{s.last_name}, {s.first_name}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max={selectedExam.max_marks}
                        value={s.marks_obtained || ''}
                        onChange={(e) => handleResultChange(s.student_id, 'marks_obtained', e.target.value)}
                        style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', width: '100%' }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        maxLength="2"
                        value={s.grade || ''}
                        onChange={(e) => handleResultChange(s.student_id, 'grade', e.target.value.toUpperCase())}
                        style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', width: '100%' }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={s.teacher_remarks || ''}
                        onChange={(e) => handleResultChange(s.student_id, 'teacher_remarks', e.target.value)}
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

      {exams.length === 0 && !loadingExams && selectedSubject && (
        <div className="sp-empty-state">
          <FileText size={48} />
          <h3>No Exams Scheduled</h3>
          <p>There are no exams found for this subject.</p>
        </div>
      )}
    </div>
  );
}
