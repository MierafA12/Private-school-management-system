import { useEffect, useState, Fragment } from 'react';
import { Plus, Trash2, RefreshCw, X } from 'lucide-react';
import { principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';
import EthiopianTimePicker from '../../components/shared/EthiopianTimePicker';
import { formatEthTime } from '../../utils/ethiopianDate';
import './principal.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const DAY_COLORS = { Monday: 'red', Tuesday: 'blue', Wednesday: 'green', Thursday: 'yellow', Friday: 'purple' };

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', padding: 4 }}
              title="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

const DEFAULT_PERIOD_TIMES = {
  1: { start: '08:00', end: '08:45' },
  2: { start: '08:45', end: '09:30' },
  3: { start: '09:30', end: '10:15' },
  4: { start: '10:30', end: '11:15' },
  5: { start: '11:15', end: '12:00' },
  6: { start: '13:00', end: '13:45' },
  7: { start: '13:45', end: '14:30' },
  8: { start: '14:30', end: '15:15' },
};

function SlotForm({ yearId, termId, classId, sectionId, period, day, onSave, onClose, saving }) {
  const [currSubjectId, setCurrSubjectId] = useState('');
  const [teacherId,     setTeacherId]     = useState('');
  const [startTime,     setStartTime]     = useState(() => DEFAULT_PERIOD_TIMES[period]?.start || '08:00');
  const [endTime,       setEndTime]       = useState(() => DEFAULT_PERIOD_TIMES[period]?.end   || '08:45');
  const [room,          setRoom]          = useState('');

  // Load own data — never depend on stale parent props
  const [curriculum, setCurriculum] = useState([]);
  const [teachers,   setTeachers]   = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    Promise.all([
      yearId && classId
        ? principalApi.getCurriculum(yearId, classId).catch(() => [])
        : Promise.resolve([]),
      principalApi.getTeacherList().catch(() => []),
    ]).then(([cur, tch]) => {
      setCurriculum(cur);
      setTeachers(tch);
    }).finally(() => setLoadingData(false));
  }, [yearId, classId]);

  const submit = (e) => {
    e.preventDefault();
    onSave({
      academic_year_id: yearId, term_id: termId,
      class_id: classId, section_id: sectionId,
      curriculum_subject_id: currSubjectId,
      teacher_id: teacherId,
      day_of_week: day, period_number: period,
      start_time: startTime, end_time: endTime,
      room_number: room || undefined,
    });
  };

  if (loadingData) return <LoadingSpinner message="Loading subjects and teachers…" />;

  return (
    <form onSubmit={submit}>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        {day} · Period {period}
      </p>
      <div className="pf-field">
        <label className="pf-label">Subject <span>*</span></label>
        {curriculum.length === 0 ? (
          <div style={{ padding: '0.6rem 0.875rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: '0.82rem', color: '#991B1B' }}>
            ⚠️ No subjects assigned to this class yet. Go to Subjects → Assign to Class first.
          </div>
        ) : (
          <select className="pf-select" value={currSubjectId} onChange={e => setCurrSubjectId(e.target.value)} required>
            <option value="">— Select Subject —</option>
            {curriculum.map(c => (
              <option key={c.id} value={c.id}>
                {c.subject_name} ({c.periods_per_week}p/wk)
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="pf-field">
        <label className="pf-label">Teacher <span>*</span></label>
        {teachers.length === 0 ? (
          <div style={{ padding: '0.6rem 0.875rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: '0.82rem', color: '#991B1B' }}>
            ⚠️ No active teachers found. Register teachers via the Registrar portal first.
          </div>
        ) : (
          <select className="pf-select" value={teacherId} onChange={e => setTeacherId(e.target.value)} required>
            <option value="">— Select Teacher —</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name} ({t.employee_number})</option>)}
          </select>
        )}
      </div>
      <div className="pf-grid-2">
        <div className="pf-field">
          <label className="pf-label">Start Time (Ethiopian Time) <span>*</span></label>
          <EthiopianTimePicker
            value={startTime}
            onChange={setStartTime}
            required
          />
        </div>
        <div className="pf-field">
          <label className="pf-label">End Time (Ethiopian Time) <span>*</span></label>
          <EthiopianTimePicker
            value={endTime}
            onChange={setEndTime}
            required
          />
        </div>
      </div>
      <div className="pf-field">
        <label className="pf-label">Room Number</label>
        <input className="pf-input" value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. Room 7" />
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-prim" disabled={saving || curriculum.length === 0 || teachers.length === 0}>
          {saving ? 'Saving…' : 'Add Slot'}
        </button>
      </div>
    </form>
  );
}

export default function Timetable() {
  const [years,      setYears]      = useState([]);
  const [terms,      setTerms]      = useState([]);
  const [classes,    setClasses]    = useState([]);
  const [teachers,   setTeachers]   = useState([]);
  const [curriculum, setCurriculum] = useState([]);
  const [slots,      setSlots]      = useState([]);

  const [yearId,     setYearId]     = useState('');
  const [termId,     setTermId]     = useState('');
  const [classId,    setClassId]    = useState('');
  const [sectionId,  setSectionId]  = useState('');
  const [sections,   setSections]   = useState([]);

  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [modal,    setModal]    = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [mError,   setMError]   = useState(null);

  // Load meta once
  useEffect(() => {
    Promise.all([principalApi.getAcademicYears(), principalApi.getClasses(), principalApi.getTeacherList()])
      .then(([y, c, t]) => {
        setYears(y); setClasses(c); setTeachers(t);
        const cur = y.find(a => a.is_current);
        if (cur) setYearId(cur.id);
      });
  }, []);

  // Load terms when year changes
  useEffect(() => {
    if (!yearId) return;
    principalApi.getAcademicYearById(yearId).then(ay => {
      setTerms(ay?.terms || []);
      setTermId(''); setSlots([]);
    });
  }, [yearId]);

  // Load sections when class changes
  useEffect(() => {
    if (!classId) { setSections([]); setSectionId(''); return; }
    principalApi.getClassById(classId).then(c => {
      setSections(c?.sections || []);
      setSectionId('');
    });
  }, [classId]);

  // Load curriculum when year+class ready
  useEffect(() => {
    if (!yearId || !classId) return;
    principalApi.getCurriculum(yearId, classId).then(setCurriculum).catch(() => setCurriculum([]));
  }, [yearId, classId]);

  // Load timetable when all filters set
  const loadSlots = async () => {
    if (!yearId || !termId || !sectionId) return;
    setLoading(true); setError(null);
    try {
      setSlots(await principalApi.getTimetable({ academic_year_id: yearId, term_id: termId, section_id: sectionId }));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadSlots(); }, [yearId, termId, sectionId]); // eslint-disable-line

  // Build grid: day → period → slot
  const grid = {};
  slots.forEach(s => {
    if (!grid[s.day_of_week]) grid[s.day_of_week] = {};
    grid[s.day_of_week][s.period_number] = s;
  });

  const addSlot = async (fields) => {
    setSaving(true); setMError(null);
    try {
      await principalApi.createTimetableSlot(fields);
      setModal(null); await loadSlots();
    } catch (err) { setMError(err.message); }
    finally { setSaving(false); }
  };

  const delSlot = async (id) => {
    try { await principalApi.deleteTimetableSlot(id); await loadSlots(); }
    catch (err) { alert(err.message); }
  };

  const clearAll = async () => {
    if (!confirm('Clear entire timetable for this section/term? This cannot be undone.')) return;
    try {
      await principalApi.clearTimetable({ term_id: termId, section_id: sectionId });
      await loadSlots();
    } catch (err) { alert(err.message); }
  };

  const canEdit = yearId && termId && classId && sectionId;

  return (
    <div>
      <div className="sp-page-header">
        <div>
          <h1 className="sp-page-title">Timetable Builder</h1>
          <p className="sp-page-sub">Weekly schedule and classroom assignments by section</p>
        </div>
        {canEdit && slots.length > 0 && (
          <button className="btn-ghost" onClick={clearAll}>
            <RefreshCw size={13} />
            <span>Clear Timetable</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <select className="pf-select" style={{ minWidth: 150, width: 'auto' }} value={yearId} onChange={e => setYearId(e.target.value)}>
          <option value="">Academic Year</option>
          {years.map(y => <option key={y.id} value={y.id}>{y.name}{y.is_current ? ' ✓' : ''}</option>)}
        </select>
        <select className="pf-select" style={{ minWidth: 120, width: 'auto' }} value={termId} onChange={e => setTermId(e.target.value)} disabled={!yearId}>
          <option value="">Term</option>
          {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="pf-select" style={{ minWidth: 140, width: 'auto' }} value={classId} onChange={e => setClassId(e.target.value)}>
          <option value="">Class</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="pf-select" style={{ minWidth: 120, width: 'auto' }} value={sectionId} onChange={e => setSectionId(e.target.value)} disabled={!classId}>
          <option value="">Section</option>
          {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
        </select>
      </div>

      {!canEdit ? (
        <div className="sp-card">
          <EmptyState icon="📅" title="Select filters above" subtitle="Choose an academic year, term, class, and section to view or build the timetable." />
        </div>
      ) : loading ? (
        <LoadingSpinner message="Loading timetable…" />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadSlots} />
      ) : (
        <div className="sp-card">
          <div className="sp-card-body" style={{ overflowX: 'auto', padding: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(5, 1fr)', gap: 4, minWidth: 700 }}>
              {/* Header */}
              <div style={{ background: '#F8FAFC', borderRadius: 4, padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', border: '1px solid #E2E8F0' }}>
                Period
              </div>
              {DAYS.map(d => (
                <div key={d} style={{ background: '#F8FAFC', borderRadius: 4, padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#0F172A', border: '1px solid #E2E8F0' }}>
                  {d}
                </div>
              ))}

              {/* Rows */}
              {PERIODS.map(p => (
                <Fragment key={`p-row-${p}`}>
                  <div style={{ background: '#F8FAFC', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', border: '1px solid #E2E8F0' }}>
                    P{p}
                  </div>
                  {DAYS.map(d => {
                    const slot = grid[d]?.[p];
                    const color = DAY_COLORS[d] || 'blue';
                    if (!slot) {
                      return (
                        <div key={d} className="tt-cell--empty" style={{ minHeight: 68, cursor: 'pointer' }}
                          onClick={() => { setModal({ day: d, period: p }); setMError(null); }}
                          title={`Add slot — ${d} Period ${p}`}>
                          <Plus size={16} />
                        </div>
                      );
                    }
                    return (
                      <div key={d} className={`tt-cell tt-cell--${color}`} style={{ position: 'relative' }}>
                        <div className="tt-subject">{slot.subject_name}</div>
                        <div className="tt-teacher">{slot.teacher_name}</div>
                        {slot.room_number && <div className="tt-room">{slot.room_number}</div>}
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {formatEthTime(slot.start_time)} – {formatEthTime(slot.end_time)}
                        </div>
                        <button
                          onClick={() => delSlot(slot.id)}
                          style={{ position: 'absolute', top: 5, right: 5, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, padding: 2, borderRadius: 4 }}
                          title="Remove slot"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {modal?.day && (
        <Modal title={`Add Slot — ${modal.day} · Period ${modal.period}`} onClose={() => setModal(null)}>
          {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
          <SlotForm
            yearId={yearId} termId={termId} classId={classId} sectionId={sectionId}
            period={modal.period} day={modal.day}
            onSave={addSlot} onClose={() => setModal(null)} saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}
