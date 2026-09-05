import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, RefreshCw, Send, ChevronRight, Check } from 'lucide-react';
import { principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';
import './principal.css';

const DAYS    = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const DAY_BG = {
  Monday:    '#FEF2F2', Tuesday: '#EFF6FF', Wednesday: '#F0FDF4',
  Thursday:  '#FFFBEB', Friday:  '#F5F3FF', Saturday:  '#F9FAFB',
};
const DAY_BORDER = {
  Monday: '#DC2626', Tuesday: '#2563EB', Wednesday: '#16A34A',
  Thursday: '#D97706', Friday: '#7C3AED', Saturday: '#6B7280',
};

const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m}${hr >= 12 ? 'PM' : 'AM'}`;
};

// ─── Slot form (inside modal) ────────────────────────────────────────────────
function SlotForm({ yearId, termId, classId, sectionId, period, day, onSave, onClose, saving }) {
  const [currSubjectId, setCurrSubjectId] = useState('');
  const [teacherId,     setTeacherId]     = useState('');
  const [startTime,     setStartTime]     = useState('');
  const [endTime,       setEndTime]       = useState('');
  const [room,          setRoom]          = useState('');
  const [curriculum,    setCurriculum]    = useState([]);
  const [teachers,      setTeachers]      = useState([]);
  const [loadingData,   setLoadingData]   = useState(true);

  useEffect(() => {
    Promise.all([
      yearId && classId ? principalApi.getCurriculum(yearId, classId).catch(() => []) : [],
      principalApi.getTeacherList().catch(() => []),
    ]).then(([cur, tch]) => {
      setCurriculum(cur); setTeachers(tch);
    }).finally(() => setLoadingData(false));
  }, [yearId, classId]);

  const submit = (e) => {
    e.preventDefault();
    onSave({ academic_year_id: yearId, term_id: termId, class_id: classId, section_id: sectionId,
             curriculum_subject_id: currSubjectId, teacher_id: teacherId,
             day_of_week: day, period_number: period, start_time: startTime, end_time: endTime,
             room_number: room || undefined });
  };

  if (loadingData) return <div style={{ padding: '1.5rem' }}><LoadingSpinner message="Loading…" /></div>;

  return (
    <form onSubmit={submit}>
      <div style={{ marginBottom: '1rem', padding: '0.5rem 0.875rem', background: '#EFF6FF', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, color: '#1D4ED8' }}>
        📅 {day} · Period {period}
      </div>

      <div className="pf-field">
        <label className="pf-label">Subject <span>*</span></label>
        {curriculum.length === 0
          ? <div style={{ padding: '0.6rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: '0.82rem', color: '#991B1B' }}>
              ⚠️ No subjects assigned to this class. Go to Subjects → Assign to Class first.
            </div>
          : <select className="pf-select" value={currSubjectId} onChange={e => setCurrSubjectId(e.target.value)} required>
              <option value="">— Select Subject —</option>
              {curriculum.map(cs => <option key={cs.id} value={cs.id}>{cs.subject_name} ({cs.subject_code})</option>)}
            </select>
        }
      </div>

      <div className="pf-field">
        <label className="pf-label">Teacher <span>*</span></label>
        {teachers.length === 0
          ? <div style={{ padding: '0.6rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: '0.82rem', color: '#991B1B' }}>
              ⚠️ No teachers registered yet. Register teachers via the Registrar portal.
            </div>
          : <select className="pf-select" value={teacherId} onChange={e => setTeacherId(e.target.value)} required>
              <option value="">— Select Teacher —</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.full_name} {t.phone ? `· ${t.phone}` : ''}
                </option>
              ))}
            </select>
        }
      </div>

      <div className="pf-grid-2">
        <div className="pf-field">
          <label className="pf-label">Start Time <span>*</span></label>
          <input type="time" className="pf-input" value={startTime} onChange={e => setStartTime(e.target.value)} required />
        </div>
        <div className="pf-field">
          <label className="pf-label">End Time <span>*</span></label>
          <input type="time" className="pf-input" value={endTime} onChange={e => setEndTime(e.target.value)} required />
        </div>
      </div>

      <div className="pf-field">
        <label className="pf-label">Room Number</label>
        <input className="pf-input" value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. Room 7" />
      </div>

      <div className="modal-footer">
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-prim"
          disabled={saving || !curriculum.length || !teachers.length}>
          {saving ? 'Saving…' : 'Add to Timetable'}
        </button>
      </div>
    </form>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function Steps({ current }) {
  const steps = ['Select Class & Term', 'Build Schedule', 'Publish & Broadcast'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: 999,
            background: current === i ? 'var(--primary)' : current > i ? '#F0FDF4' : 'var(--bg-color)',
            color: current === i ? 'white' : current > i ? '#15803D' : 'var(--text-muted)',
            fontWeight: 600, fontSize: '0.82rem',
            border: `1px solid ${current === i ? 'var(--primary)' : current > i ? '#BBF7D0' : 'var(--border-color)'}`,
          }}>
            {current > i ? <Check size={13} /> : <span style={{ fontWeight: 800 }}>{i + 1}</span>}
            {s}
          </div>
          {i < steps.length - 1 && <ChevronRight size={16} style={{ color: 'var(--text-muted)', margin: '0 0.25rem' }} />}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Timetable() {
  const [step, setStep] = useState(0);   // 0=select, 1=build, 2=publish

  // Meta
  const [years,    setYears]    = useState([]);
  const [terms,    setTerms]    = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [sections, setSections] = useState([]);

  // Selection
  const [yearId,    setYearId]    = useState('');
  const [termId,    setTermId]    = useState('');
  const [termName,  setTermName]  = useState('');
  const [classId,   setClassId]   = useState('');
  const [className, setClassName] = useState('');
  const [sectionId,    setSectionId]    = useState('');
  const [sectionName,  setSectionName]  = useState('');

  // Grid data
  const [slots,   setSlots]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Modal
  const [modal,  setModal]  = useState(null);
  const [saving, setSaving] = useState(false);
  const [mError, setMError] = useState(null);

  // Publishing
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);

  // Load meta on mount
  useEffect(() => {
    Promise.all([principalApi.getAcademicYears(), principalApi.getClasses()])
      .then(([y, c]) => {
        setYears(y); setClasses(c);
        const cur = y.find(a => a.is_current);
        if (cur) {
          setYearId(cur.id);
          principalApi.getAcademicYearById(cur.id).then(ay => setTerms(ay?.terms || []));
        }
      });
  }, []);

  const handleClassChange = (id) => {
    setClassId(id);
    setSectionId(''); setSectionName('');
    const found = classes.find(c => c.id === id);
    setClassName(found?.name || '');
    if (!id) { setSections([]); return; }
    principalApi.getClassById(id).then(c => setSections(c?.sections || []));
  };

  const handleYearChange = (id) => {
    setYearId(id);
    setTermId(''); setTermName('');
    if (!id) { setTerms([]); return; }
    principalApi.getAcademicYearById(id).then(ay => setTerms(ay?.terms || []));
  };

  // Load slots
  const loadSlots = useCallback(async () => {
    if (!yearId || !termId || !sectionId) return;
    setLoading(true); setError(null);
    try {
      setSlots(await principalApi.getTimetable({ academic_year_id: yearId, term_id: termId, section_id: sectionId }));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [yearId, termId, sectionId]);

  useEffect(() => { if (step === 1) loadSlots(); }, [step, loadSlots]);

  // Build grid
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
    if (!confirm('Remove this period?')) return;
    try { await principalApi.deleteTimetableSlot(id); await loadSlots(); }
    catch (err) { alert(err.message); }
  };

  const clearAll = async () => {
    if (!confirm(`Clear entire timetable for ${className} Section ${sectionName}? This cannot be undone.`)) return;
    try {
      await principalApi.clearTimetable({ term_id: termId, section_id: sectionId });
      await loadSlots();
    } catch (err) { alert(err.message); }
  };

  const broadcast = async () => {
    if (!confirm(`Publish this timetable and send an announcement to all students in ${className} Section ${sectionName}?`)) return;
    setBroadcasting(true);
    try {
      await principalApi.broadcastTimetable({
        term_id: termId, section_id: sectionId, class_id: classId,
        term_name: termName, class_name: className, section_name: sectionName,
      });
      setBroadcastDone(true);
    } catch (err) { alert(err.message); }
    finally { setBroadcasting(false); }
  };

  // Computed — active days (only days that have at least one slot)
  const activeDays = DAYS.filter(d => slots.some(s => s.day_of_week === d));
  const displayDays = activeDays.length > 0 ? activeDays : DAYS.slice(0, 5);
  const maxPeriod = slots.length > 0 ? Math.max(...slots.map(s => s.period_number), 6) : 6;
  const displayPeriods = PERIODS.slice(0, maxPeriod);

  // ── Step 0: Select ────────────────────────────────────────────────────────
  const renderStep0 = () => (
    <div className="sp-card" style={{ maxWidth: 600 }}>
      <div className="sp-card-header"><span className="sp-card-title">📚 Choose Class & Term</span></div>
      <div className="sp-card-body">
        <div className="pf-grid-2">
          <div className="pf-field">
            <label className="pf-label">Academic Year <span>*</span></label>
            <select className="pf-select" value={yearId} onChange={e => handleYearChange(e.target.value)}>
              <option value="">— Select —</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.name}{y.is_current ? ' ✓' : ''}</option>)}
            </select>
          </div>
          <div className="pf-field">
            <label className="pf-label">Term <span>*</span></label>
            <select className="pf-select" value={termId}
              onChange={e => { setTermId(e.target.value); setTermName(terms.find(t => t.id === e.target.value)?.name || ''); }}
              disabled={!yearId}>
              <option value="">— Select —</option>
              {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="pf-field">
            <label className="pf-label">Class <span>*</span></label>
            <select className="pf-select" value={classId} onChange={e => handleClassChange(e.target.value)}>
              <option value="">— Select —</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="pf-field">
            <label className="pf-label">Section <span>*</span></label>
            <select className="pf-select" value={sectionId}
              onChange={e => { setSectionId(e.target.value); setSectionName(sections.find(s => s.id === e.target.value)?.name || ''); }}
              disabled={!classId}>
              <option value="">— Select —</option>
              {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-prim"
            disabled={!yearId || !termId || !classId || !sectionId}
            onClick={() => setStep(1)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            Build Timetable <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  // ── Step 1: Build grid ────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div>
      {/* Selection summary + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ padding: '0.5rem 1rem', background: '#EFF6FF', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, color: '#1D4ED8' }}>
          {className} · Section {sectionName} · {termName}
        </div>
        <button className="btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => setStep(0)}>
          ← Change
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          {slots.length > 0 && (
            <>
              <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.82rem' }}
                onClick={clearAll}><RefreshCw size={14} /> Clear All</button>
              <button className="btn-prim" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
                onClick={() => setStep(2)}>
                Publish & Broadcast <ChevronRight size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? <LoadingSpinner message="Loading timetable…" /> :
       error   ? <ErrorBanner message={error} onRetry={loadSlots} /> : (

        <div className="sp-card">
          <div className="sp-card-body" style={{ overflowX: 'auto', padding: '1rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `72px repeat(${displayDays.length}, 1fr)`,
              gap: 6,
              minWidth: displayDays.length * 140 + 72,
            }}>
              {/* Header */}
              <div style={{ padding: '0.5rem', borderRadius: 8, background: '#F8FAFC', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>
                PERIOD
              </div>
              {displayDays.map(d => (
                <div key={d} style={{
                  padding: '0.5rem', borderRadius: 8, textAlign: 'center',
                  background: DAY_BG[d], borderBottom: `2px solid ${DAY_BORDER[d]}`,
                  fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)',
                }}>
                  {d}
                </div>
              ))}

              {/* Rows */}
              {displayPeriods.map(p => (
                <>
                  <div key={`p${p}`} style={{
                    padding: '0.5rem', borderRadius: 8, background: '#F8FAFC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)',
                  }}>
                    P{p}
                  </div>

                  {displayDays.map(d => {
                    const slot = grid[d]?.[p];
                    if (!slot) {
                      return (
                        <div key={d} onClick={() => { setModal({ day: d, period: p }); setMError(null); }}
                          style={{
                            borderRadius: 8, minHeight: 80, border: '2px dashed var(--border-color)',
                            background: '#FAFAFA', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = '#FEF2F2'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = '#FAFAFA'; }}
                          title={`Add period — ${d} P${p}`}
                        >
                          <Plus size={18} color="var(--text-muted)" />
                        </div>
                      );
                    }

                    return (
                      <div key={d} style={{
                        borderRadius: 8, padding: '0.6rem 0.75rem',
                        background: DAY_BG[d],
                        borderLeft: `3px solid ${DAY_BORDER[d]}`,
                        position: 'relative', minHeight: 80,
                      }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: '0.15rem' }}>
                          {slot.subject_name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#4B5563' }}>
                          👤 {slot.teacher_name}
                        </div>
                        {slot.room_number && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            🚪 {slot.room_number}
                          </div>
                        )}
                        {(slot.start_time || slot.end_time) && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            ⏰ {fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}
                          </div>
                        )}
                        <button onClick={() => delSlot(slot.id)}
                          style={{
                            position: 'absolute', top: 4, right: 4, background: 'none',
                            border: 'none', cursor: 'pointer', color: '#9CA3AF',
                            padding: '0.15rem',
                          }}
                          title="Remove">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </>
              ))}
            </div>

            <p style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Click any empty cell to add a period. {slots.length} period{slots.length !== 1 ? 's' : ''} scheduled.
            </p>
          </div>
        </div>
      )}

      {/* Add slot modal */}
      {modal?.day && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <h3>Add Period</h3>
            {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
            <SlotForm
              yearId={yearId} termId={termId} classId={classId} sectionId={sectionId}
              period={modal.period} day={modal.day}
              onSave={addSlot} onClose={() => setModal(null)} saving={saving}
            />
          </div>
        </div>
      )}
    </div>
  );

  // ── Step 2: Publish ───────────────────────────────────────────────────────
  const renderStep2 = () => (
    <div className="sp-card" style={{ maxWidth: 560 }}>
      <div className="sp-card-header"><span className="sp-card-title">📢 Publish & Broadcast Timetable</span></div>
      <div className="sp-card-body">
        {broadcastDone ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
            <h3 style={{ fontWeight: 700, color: '#15803D', marginBottom: '0.5rem' }}>Published!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Timetable published. An announcement has been sent to all students in {className} Section {sectionName}.
              They will see it in their portal under Notices.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => { setStep(0); setBroadcastDone(false); }}>
                New Timetable
              </button>
              <button className="btn-prim" onClick={() => setStep(1)}>
                Back to Editor
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, color: '#15803D', marginBottom: '0.5rem' }}>✓ Timetable Ready</div>
              <div style={{ fontSize: '0.875rem', color: '#166534' }}>
                <strong>{className} · Section {sectionName} · {termName}</strong><br />
                {slots.length} period{slots.length !== 1 ? 's' : ''} scheduled across {displayDays.length} day{displayDays.length !== 1 ? 's' : ''}.
              </div>
            </div>

            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Publishing will:
              <ul style={{ margin: '0.5rem 0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li>Make the timetable visible to all students in this section</li>
                <li>Make it visible to all assigned teachers</li>
                <li>Send an announcement to the class notifying them</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setStep(1)}>← Back to Editor</button>
              <button className="btn-prim" onClick={broadcast} disabled={broadcasting}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={15} />
                {broadcasting ? 'Publishing…' : 'Publish & Send Announcement'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Timetable Builder</h1>
        <p className="sp-page-sub">Build weekly schedules and broadcast them to students</p>
      </div>

      <Steps current={step} />

      {step === 0 && renderStep0()}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
    </div>
  );
}
