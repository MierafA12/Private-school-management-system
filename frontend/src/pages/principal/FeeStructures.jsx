import { useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, X, DollarSign, CalendarDays, Layers, Search, CheckCircle2 } from 'lucide-react';
import { principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';
import EthiopianDatePicker from '../../components/shared/EthiopianDatePicker';
import './principal.css';

const FEE_TYPES = [
  'Tuition', 'Registration', 'Admission', 'Transport', 'Uniform',
  'Laboratory', 'Library', 'Exam', 'Activity', 'Caution', 'Other',
];

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: wide ? 580 : 500 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted, #64748B)',
                display: 'flex',
                padding: 4,
                borderRadius: 4,
              }}
              title="Close modal"
              aria-label="Close modal"
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

function FeeForm({ initial = {}, years, classes, onSave, onClose, saving }) {
  const [yearId,   setYearId]   = useState(initial.academic_year_id || '');
  const [classId,  setClassId]  = useState(initial.class_id         || '');
  const [feeType,  setFeeType]  = useState(initial.fee_type         || 'Tuition');
  const [amount,   setAmount]   = useState(initial.amount           || '');
  const [currency, setCurrency] = useState(initial.currency         || 'ETB');
  const [dueDate,  setDueDate]  = useState(initial.due_date?.slice(0, 10) || '');
  const [desc,     setDesc]     = useState(initial.description       || '');

  const submit = (e) => {
    e.preventDefault();
    onSave({
      academic_year_id: yearId,
      class_id: classId || undefined,
      fee_type: feeType,
      amount: parseFloat(amount),
      currency,
      due_date: dueDate || undefined,
      description: desc || undefined,
    });
  };

  return (
    <form onSubmit={submit}>
      <div className="pf-grid-2">
        <div className="pf-field">
          <label className="pf-label">Academic Year <span>*</span></label>
          <select className="pf-select" value={yearId} onChange={(e) => setYearId(e.target.value)} required>
            <option value="">— Select Year —</option>
            {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        </div>
        <div className="pf-field">
          <label className="pf-label">Class Scope</label>
          <select className="pf-select" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">All Classes (School-wide)</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="pf-field">
          <label className="pf-label">Fee Type <span>*</span></label>
          <select className="pf-select" value={feeType} onChange={(e) => setFeeType(e.target.value)} required>
            {FEE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="pf-field">
          <label className="pf-label">Amount (Birr) <span>*</span></label>
          <input
            type="number"
            className="pf-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min={0}
            step="0.01"
            required
          />
        </div>
        <div className="pf-field">
          <label className="pf-label">Currency</label>
          <select className="pf-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="ETB">ETB — Ethiopian Birr (Br)</option>
            <option value="USD">USD — US Dollar ($)</option>
            <option value="EUR">EUR — Euro (€)</option>
            <option value="GBP">GBP — British Pound (£)</option>
          </select>
        </div>
        <div className="pf-field">
          <label className="pf-label">Due Date (Ethiopian Calendar)</label>
          <EthiopianDatePicker
            value={dueDate}
            onChange={setDueDate}
          />
        </div>
      </div>
      <div className="pf-field">
        <label className="pf-label">Description / Notes</label>
        <input
          className="pf-input"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="e.g. Due before midterm examinations"
        />
      </div>
      <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.25rem' }}>
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-prim" disabled={saving}>
          {saving ? 'Saving…' : initial.id ? 'Save Changes' : 'Create Fee Structure'}
        </button>
      </div>
    </form>
  );
}

export default function FeeStructures() {
  const [structures,   setStructures]   = useState([]);
  const [years,        setYears]        = useState([]);
  const [classes,      setClasses]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [filterYear,   setFilterYear]   = useState('');
  const [filterClass,  setFilterClass]  = useState('');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [modal,        setModal]        = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [mError,       setMError]       = useState(null);
  const [successMsg,   setSuccessMsg]   = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [s, y, c] = await Promise.all([
        principalApi.getFeeStructures(filterYear || undefined),
        principalApi.getAcademicYears(),
        principalApi.getClasses(),
      ]);
      setStructures(Array.isArray(s) ? s : []);
      setYears(Array.isArray(y) ? y : []);
      setClasses(Array.isArray(c) ? c : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterYear]); // eslint-disable-line

  const save = async (fields) => {
    setSaving(true);
    setMError(null);
    try {
      if (modal.data) {
        await principalApi.updateFeeStructure(modal.data.id, fields);
        setSuccessMsg('Fee structure updated successfully.');
      } else {
        await principalApi.createFeeStructure(fields);
        setSuccessMsg('Fee structure created successfully.');
      }
      setTimeout(() => setSuccessMsg(''), 4000);
      setModal(null);
      await load();
    } catch (err) {
      setMError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this fee structure? Existing student invoices referencing this will remain.')) return;
    try {
      await principalApi.deleteFeeStructure(id);
      setSuccessMsg('Fee structure removed.');
      setTimeout(() => setSuccessMsg(''), 4000);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const fmtAmount = (a, cur = 'ETB') => {
    const val = parseFloat(a || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return cur === 'ETB' ? `${val} ETB` : `${cur} ${val}`;
  };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  // Filtered items
  const filtered = useMemo(() => {
    return structures.filter((s) => {
      if (filterClass && s.class_id !== filterClass) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchType = s.fee_type?.toLowerCase().includes(q);
        const matchClass = s.class_name?.toLowerCase().includes(q);
        const matchDesc = s.description?.toLowerCase().includes(q);
        if (!matchType && !matchClass && !matchDesc) return false;
      }
      return true;
    });
  }, [structures, filterClass, searchQuery]);

  // Statistics
  const totalCount = structures.length;
  const tuitionCount = structures.filter((s) => s.fee_type === 'Tuition').length;
  const avgAmount = totalCount
    ? Math.round(structures.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0) / totalCount)
    : 0;

  if (loading) return <LoadingSpinner message="Loading school fee structures…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="sp-page-header">
        <div>
          <h1 className="sp-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={22} style={{ color: 'var(--primary, #991B1B)' }} />
            Fee Structures
          </h1>
          <p className="sp-page-sub">Configure official tuition, transport, and semester fees per academic year and class</p>
        </div>
        <button
          type="button"
          className="btn-prim"
          onClick={() => { setModal({ type: 'fee' }); setMError(null); }}
        >
          <Plus size={15} />
          <span>Add Fee Structure</span>
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

      {/* ── Metric Summary Strip ── */}
      <div className="sp-stats-grid">
        <div className="sp-stat-card">
          <div className="sp-stat-header">
            <span className="sp-stat-label">Fee Items Defined</span>
            <span className="sp-stat-icon"><Layers size={16} /></span>
          </div>
          <div className="sp-stat-value">{totalCount}</div>
          <div className="sp-stat-sub">Across all classes & semesters</div>
        </div>

        <div className="sp-stat-card">
          <div className="sp-stat-header">
            <span className="sp-stat-label">Tuition Items</span>
            <span className="sp-stat-icon"><DollarSign size={16} /></span>
          </div>
          <div className="sp-stat-value">{tuitionCount}</div>
          <div className="sp-stat-sub">Core academic fees</div>
        </div>

        <div className="sp-stat-card">
          <div className="sp-stat-header">
            <span className="sp-stat-label">Average Fee Amount</span>
            <span className="sp-stat-icon"><CalendarDays size={16} /></span>
          </div>
          <div className="sp-stat-value">{avgAmount.toLocaleString()} ETB</div>
          <div className="sp-stat-sub">Ethiopian Birr average</div>
        </div>
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="sp-filter-toolbar">
        <div className="sp-filter-group">
          <select
            className="pf-select"
            style={{ width: 'auto', minWidth: 170 }}
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          >
            <option value="">All Academic Years</option>
            {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>

          <select
            className="pf-select"
            style={{ width: 'auto', minWidth: 160 }}
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, color: '#94A3B8', pointerEvents: 'none' }} />
            <input
              type="text"
              className="pf-input"
              style={{ paddingLeft: '2rem', width: 200, height: 34 }}
              placeholder="Search fee type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
          Showing {filtered.length} of {structures.length} fee structures
        </span>
      </div>

      {/* ── Fee Structures Table ── */}
      <div className="sp-card">
        {filtered.length === 0 ? (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <Layers size={32} style={{ color: '#CBD5E1', margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main, #0F172A)', margin: '0 0 0.25rem 0' }}>
              No Fee Structures Found
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748B)', margin: '0 0 1rem 0' }}>
              {searchQuery || filterClass || filterYear
                ? 'No fee structures match the selected filter criteria.'
                : 'Define tuition, admission, or recurring fees to allow automated student invoicing.'}
            </p>
            <button
              type="button"
              className="btn-prim"
              onClick={() => { setModal({ type: 'fee' }); setMError(null); }}
              style={{ margin: '0 auto' }}
            >
              <Plus size={14} /> Add First Fee Structure
            </button>
          </div>
        ) : (
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Academic Year</th>
                  <th>Class Scope</th>
                  <th>Fee Type</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const isTuition = s.fee_type === 'Tuition';
                  const isTransport = s.fee_type === 'Transport';
                  const badgeVariant = isTuition ? 'sp-badge--red' : isTransport ? 'sp-badge--blue' : 'sp-badge--gray';

                  return (
                    <tr key={s.id}>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748B)', fontWeight: 500 }}>
                        {s.academic_year_name || '—'}
                      </td>
                      <td>
                        {s.class_name ? (
                          <span className="sp-badge sp-badge--gray" style={{ fontWeight: 500 }}>
                            {s.class_name}
                          </span>
                        ) : (
                          <span className="sp-badge sp-badge--green" style={{ fontWeight: 500 }}>
                            All Classes
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`sp-badge ${badgeVariant}`} style={{ fontWeight: 600 }}>
                          {s.fee_type}
                        </span>
                        {s.description && (
                          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted, #94A3B8)', marginTop: '0.15rem' }}>
                            {s.description}
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {fmtAmount(s.amount, s.currency)}
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748B)' }}>
                        {fmtDate(s.due_date)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn-edit"
                            onClick={() => { setModal({ type: 'fee', data: s }); setMError(null); }}
                            title="Edit fee structure"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn-danger"
                            onClick={() => del(s.id)}
                            title="Delete fee structure"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Dialog ── */}
      {modal?.type === 'fee' && (
        <Modal
          title={modal.data ? 'Edit Fee Structure' : 'Add Fee Structure'}
          onClose={() => setModal(null)}
        >
          {mError && (
            <p style={{ color: 'var(--primary, #DC2626)', fontSize: '0.8125rem', marginBottom: '0.75rem', fontWeight: 500 }}>
              {mError}
            </p>
          )}
          <FeeForm
            initial={modal.data || {}}
            years={years}
            classes={classes}
            onSave={save}
            onClose={() => setModal(null)}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}

