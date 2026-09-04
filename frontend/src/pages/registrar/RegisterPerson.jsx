import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, UserCheck, BookOpen, Briefcase, RotateCcw,
  CheckCircle2, UserPlus, Users, User, KeyRound, Eye, EyeOff,
  Sparkles, Copy, Check, ArrowRight, PhoneCall, AlertCircle, Loader2,
} from 'lucide-react';
import EthiopiaFlag from '../../components/shared/EthiopiaFlag';
import { registrarApi } from '../../api';
import { ErrorBanner } from '../../components/shared/PageState';
import '../../styles/portals/registrar.css';

const ROLES = [
  { key: 'student', label: 'Student', caption: 'Enrolled learner', icon: GraduationCap },
  { key: 'parent',  label: 'Parent',  caption: 'Guardian / sponsor', icon: UserCheck },
  { key: 'teacher', label: 'Teacher', caption: 'Faculty & instructor', icon: BookOpen },
  { key: 'staff',   label: 'Staff',   caption: 'Admin & operations', icon: Briefcase },
];

const STAFF_ROLES = ['Registrar', 'Accountant', 'Principal', 'Super Admin'];

// ─── Field components ─────────────────────────────────────────────────────────
function Field({ label, required, hint, optional, className, children }) {
  return (
    <div className={`rg-field ${className || ''}`}>
      <label className="rg-label">
        <span>
          {label} {required && <span className="req">*</span>}
        </span>
        {optional && <span className="opt">Optional</span>}
      </label>
      {children}
      {hint && <span className="rg-hint">{hint}</span>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', required, minLength, ...rest }) {
  return (
    <input
      className="rg-input"
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      minLength={minLength}
      {...rest}
    />
  );
}

function PhoneInput({ value, onChange, placeholder = '911 234 567', required, ...rest }) {
  return (
    <div className="rg-phone-wrap">
      <div className="rg-phone-addon" title="Ethiopia (+251)">
        <EthiopiaFlag width={18} height={12} />
        <span>+251</span>
      </div>
      <input
        className="rg-input rg-phone-input"
        type="tel"
        value={value ? value.replace(/^\+251\s*/, '') : ''}
        onChange={(e) => {
          const val = e.target.value.trim();
          onChange(val ? (val.startsWith('+251') ? val : `+251 ${val}`) : '');
        }}
        placeholder={placeholder}
        required={required}
        {...rest}
      />
    </div>
  );
}

function Select({ value, onChange, options, placeholder, required }) {
  return (
    <select
      className="rg-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  );
}

// ─── Success Card Component ───────────────────────────────────────────────────
function SuccessCard({ result, role, onAgain }) {
  const [copied, setCopied] = useState(false);

  const creds = [
    result.student_number   && ['Student ID',        result.student_number],
    result.admission_number && ['Admission Number',  result.admission_number],
    result.employee_number  && ['Employee Number',   result.employee_number],
    result.first_name       && ['Full Name',         `${result.first_name} ${result.middle_name || ''} ${result.last_name || ''}`.trim()],
    result.email            && ['Email Address',     result.email],
    result.phone            && ['Phone Number',      result.phone],
    result.password         && ['Initial Password',  result.password],
  ].filter(Boolean);

  const handleCopy = () => {
    const text = creds.map(([k, v]) => `${k}: ${v}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="rg-success">
      <div className="rg-success-badge">
        <CheckCircle2 size={26} />
      </div>
      <h3>{role.charAt(0).toUpperCase() + role.slice(1)} Registered Successfully</h3>
      <p>
        The official account has been created. The user can log in immediately using their email or phone number with their assigned password.
      </p>

      <div className="rg-cred-box">
        <div className="rg-cred-header">
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Account Credentials Summary
          </span>
          <button
            type="button"
            className="btn-ghost"
            onClick={handleCopy}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            title="Copy credentials to clipboard"
          >
            {copied ? <><Check size={13} color="#16A34A" /> Copied!</> : <><Copy size={13} /> Copy Details</>}
          </button>
        </div>
        {creds.map(([k, v]) => (
          <div className="rg-cred-row" key={k}>
            <span className="rg-cred-key">{k}</span>
            <span className="rg-cred-value">{v}</span>
          </div>
        ))}
      </div>

      <div className="rg-success-actions">
        <button
          type="button"
          className="btn-prim"
          onClick={onAgain}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <UserPlus size={15} />
          <span>Register Another Person</span>
        </button>

        <Link
          to={`/registrar/users?role=${role.charAt(0).toUpperCase() + role.slice(1)}`}
          className="btn-ghost"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', textDecoration: 'none' }}
        >
          <span>View in User Directory</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component: RegisterPerson
// ─────────────────────────────────────────────────────────────────────────────
export default function RegisterPerson() {
  const [role,         setRole]         = useState('student');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [result,       setResult]       = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // ── Shared fields ──────────────────────────────────────────────────────────
  const [firstName,  setFirstName]  = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName,   setLastName]   = useState('');
  const [gender,     setGender]     = useState('Male');
  const [email,      setEmail]      = useState('');
  const [phone,      setPhone]      = useState('');
  const [password,   setPassword]   = useState('');

  // ── Student-only fields ────────────────────────────────────────────────────
  const [dob,            setDob]            = useState('');
  const [address,        setAddress]        = useState('');
  const [emergencyName,  setEmergencyName]  = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [admissionDate,  setAdmissionDate]  = useState(new Date().toISOString().slice(0, 10));
  const [previousSchool, setPreviousSchool] = useState('');
  const [bloodGroup,     setBloodGroup]     = useState('');
  const [nationality,    setNationality]    = useState('Ethiopian');
  const [religion,       setReligion]       = useState('');

  // ── Parent-only fields ─────────────────────────────────────────────────────
  const [relationship,   setRelationship]   = useState('Father');
  const [parentAddress,  setParentAddress]  = useState('');
  const [occupation,     setOccupation]     = useState('');
  const [nationalId,     setNationalId]     = useState('');
  const [studentNumber,  setStudentNumber]  = useState('');
  const [isPrimary,      setIsPrimary]      = useState(true);

  // ── Teacher-only fields ────────────────────────────────────────────────────
  const [qualification,  setQualification]  = useState('');
  const [specialization, setSpecialization] = useState('');
  const [yearsExp,       setYearsExp]       = useState('');
  const [hireDate,       setHireDate]       = useState(new Date().toISOString().slice(0, 10));
  const [teacherDob,     setTeacherDob]     = useState('');

  // ── Staff-only fields ──────────────────────────────────────────────────────
  const [staffRole,      setStaffRole]      = useState('Registrar');
  const [department,     setDepartment]     = useState('');
  const [office,         setOffice]         = useState('');
  const [staffHireDate,  setStaffHireDate]  = useState(new Date().toISOString().slice(0, 10));
  const [staffDob,       setStaffDob]       = useState('');

  const resetForm = () => {
    setFirstName(''); setMiddleName(''); setLastName(''); setGender('Male');
    setEmail(''); setPhone(''); setPassword('');
    setDob(''); setAddress(''); setEmergencyName(''); setEmergencyPhone('');
    setAdmissionDate(new Date().toISOString().slice(0, 10)); setPreviousSchool('');
    setBloodGroup(''); setNationality('Ethiopian'); setReligion('');
    setRelationship('Father'); setParentAddress(''); setOccupation('');
    setNationalId(''); setStudentNumber(''); setIsPrimary(true);
    setQualification(''); setSpecialization(''); setYearsExp('');
    setHireDate(new Date().toISOString().slice(0, 10)); setTeacherDob('');
    setStaffRole('Registrar'); setDepartment(''); setOffice('');
    setStaffHireDate(new Date().toISOString().slice(0, 10)); setStaffDob('');
    setResult(null); setError(null);
  };

  const handleRoleChange = (r) => {
    setRole(r);
    resetForm();
  };

  const generateRandomPassword = () => {
    const prefixes = ['Ethio', 'Addis', 'Nile', 'School', 'Edu'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const year = 2026;
    const special = ['!', '#', '@', '$'][Math.floor(Math.random() * 4)];
    const num = Math.floor(100 + Math.random() * 900);
    const generated = `${prefix}${year}${special}${num}`;
    setPassword(generated);
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() && !phone.trim()) {
      setError('At least one of Email Address or Phone Number is required to create a login account.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let res;
      if (role === 'student') {
        res = await registrarApi.registerStudent({
          first_name: firstName, middle_name: middleName, last_name: lastName,
          gender, date_of_birth: dob, email: email || undefined, phone: phone || undefined,
          password, address, emergency_contact_name: emergencyName,
          emergency_contact_phone: emergencyPhone, admission_date: admissionDate,
          previous_school: previousSchool || undefined, blood_group: bloodGroup || undefined,
          nationality: nationality || undefined, religion: religion || undefined,
        });
      } else if (role === 'parent') {
        res = await registrarApi.registerParent({
          first_name: firstName, middle_name: middleName, last_name: lastName,
          gender: gender || undefined, relationship,
          email: email || undefined, phone: phone || undefined, password,
          address: parentAddress, occupation: occupation || undefined,
          national_id: nationalId || undefined,
          student_number: studentNumber || undefined,
          is_primary_contact: isPrimary,
        });
      } else if (role === 'teacher') {
        res = await registrarApi.registerTeacher({
          first_name: firstName, middle_name: middleName, last_name: lastName,
          gender, date_of_birth: teacherDob || undefined, qualification,
          specialization: specialization || undefined,
          years_of_experience: yearsExp ? parseInt(yearsExp, 10) : 0,
          email: email || undefined, phone: phone || undefined, password,
          hire_date: hireDate,
        });
      } else {
        res = await registrarApi.registerStaff({
          first_name: firstName, middle_name: middleName, last_name: lastName,
          gender, role_name: staffRole, date_of_birth: staffDob || undefined,
          email: email || undefined, phone: phone || undefined, password,
          department: department || undefined, office_location: office || undefined,
          hire_date: staffHireDate,
        });
      }
      setResult({ ...res, password });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="rg-container">
        <div className="sp-page-header">
          <div>
            <h1 className="sp-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={22} color="#16A34A" />
              Registration Complete
            </h1>
            <p className="sp-page-sub">Account has been provisioned and added to the official school directory</p>
          </div>
        </div>
        <SuccessCard result={result} role={role} onAgain={resetForm} />
      </div>
    );
  }

  const activeRoleObj = ROLES.find((r) => r.key === role) || ROLES[0];
  const ActiveIcon = activeRoleObj.icon;

  return (
    <div className="rg-container">
      {/* ── Page Header ── */}
      <div className="sp-page-header">
        <div>
          <h1 className="sp-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={22} style={{ color: 'var(--primary, #991B1B)' }} />
            Register Person
          </h1>
          <p className="sp-page-sub">
            Enroll students, register parents, or onboard teaching faculty and staff
          </p>
        </div>
        <Link
          to="/registrar/users"
          className="btn-ghost"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <Users size={15} />
          <span>User Directory</span>
        </Link>
      </div>

      {/* ── Role Selector Grid ── */}
      <div className="rg-role-grid">
        {ROLES.map(({ key, label, caption, icon: Icon }) => {
          const isActive = role === key;
          return (
            <button
              type="button"
              key={key}
              className={`rg-role-card ${isActive ? 'rg-role-card--active' : ''}`}
              onClick={() => handleRoleChange(key)}
            >
              <div className="rg-role-icon">
                <Icon size={18} />
              </div>
              <div className="rg-role-title">{label}</div>
              <div className="rg-role-caption">{caption}</div>
            </button>
          );
        })}
      </div>

      {/* ── Registration Form Card ── */}
      <form onSubmit={handleSubmit}>
        <div className="rg-form-card">
          {/* Card Header */}
          <div className="rg-form-header">
            <div className="rg-form-header-left">
              <div className="rg-form-header-icon">
                <ActiveIcon size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {activeRoleObj.label} Enrollment Form
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Fill in official profile details and login credentials
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-ghost"
              onClick={resetForm}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              title="Reset all form fields"
            >
              <RotateCcw size={13} />
              <span>Clear Form</span>
            </button>
          </div>

          <div className="rg-form-body">
            {error && <ErrorBanner message={error} />}

            {/* ══════════════════════════════════════════════════════════════
                1. Personal Identity
               ══════════════════════════════════════════════════════════════ */}
            <div className="rg-section">
              <div className="rg-section-header">
                <User size={15} style={{ color: 'var(--primary, #991B1B)' }} />
                <h4 className="rg-section-title">Personal Identity</h4>
              </div>

              <div className="rg-grid-3">
                <Field label="First Name" required>
                  <Input value={firstName} onChange={setFirstName} placeholder="e.g. Abebe" required />
                </Field>
                <Field label="Middle / Father's Name" optional>
                  <Input value={middleName} onChange={setMiddleName} placeholder="e.g. Kebede" />
                </Field>
                <Field label="Last / Grandfather's Name" required>
                  <Input value={lastName} onChange={setLastName} placeholder="e.g. Bekele" required />
                </Field>
              </div>

              <div className="rg-grid">
                <Field label="Gender" required={role !== 'parent'}>
                  <Select
                    value={gender}
                    onChange={setGender}
                    placeholder="— Select Gender —"
                    options={[
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                      { value: 'Other', label: 'Other' },
                    ]}
                    required={role !== 'parent'}
                  />
                </Field>

                {role === 'student' && (
                  <Field label="Date of Birth" required>
                    <Input type="date" value={dob} onChange={setDob} required />
                  </Field>
                )}
                {role === 'teacher' && (
                  <Field label="Date of Birth" optional>
                    <Input type="date" value={teacherDob} onChange={setTeacherDob} />
                  </Field>
                )}
                {role === 'staff' && (
                  <Field label="Date of Birth" optional>
                    <Input type="date" value={staffDob} onChange={setStaffDob} />
                  </Field>
                )}
                {role === 'parent' && (
                  <Field label="Relationship to Student" required>
                    <Select
                      value={relationship}
                      onChange={setRelationship}
                      placeholder="— Select Relationship —"
                      options={[
                        { value: 'Father', label: 'Father' },
                        { value: 'Mother', label: 'Mother' },
                        { value: 'Guardian', label: 'Legal Guardian' },
                        { value: 'Sibling', label: 'Older Sibling' },
                        { value: 'Other', label: 'Other Relative' },
                      ]}
                      required
                    />
                  </Field>
                )}
              </div>

              {role === 'student' && (
                <div className="rg-grid-3">
                  <Field label="Blood Group" optional>
                    <Select
                      value={bloodGroup}
                      onChange={setBloodGroup}
                      placeholder="— Optional —"
                      options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((v) => ({ value: v, label: v }))}
                    />
                  </Field>
                  <Field label="Nationality">
                    <Input value={nationality} onChange={setNationality} placeholder="e.g. Ethiopian" />
                  </Field>
                  <Field label="Religion" optional>
                    <Input value={religion} onChange={setReligion} placeholder="e.g. Orthodox / Muslim / Protestant" />
                  </Field>
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                2. Login & Authentication
               ══════════════════════════════════════════════════════════════ */}
            <div className="rg-section">
              <div className="rg-section-header">
                <KeyRound size={15} style={{ color: 'var(--primary, #991B1B)' }} />
                <h4 className="rg-section-title">Login Credentials & Contact</h4>
              </div>

              <div className="rg-grid">
                <Field
                  label="Email Address"
                  hint="Primary login credential (optional if phone provided)"
                >
                  <Input
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="e.g. user@school.edu.et"
                  />
                </Field>

                <Field
                  label="Phone Number"
                  hint="Mobile login credential with Ethiopia (+251) prefix"
                >
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    placeholder="911 234 567"
                  />
                </Field>
              </div>

              <div className="rg-grid">
                <Field
                  label="Initial Password"
                  required
                  hint="Min 6 characters — the user can update this after first login"
                >
                  <div className="rg-password-wrap">
                    <input
                      className="rg-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      style={{ paddingRight: 75 }}
                    />
                    <div className="rg-password-actions">
                      <button
                        type="button"
                        className="rg-icon-btn"
                        onClick={generateRandomPassword}
                        title="Generate strong random password"
                      >
                        <Sparkles size={14} color="var(--primary, #991B1B)" />
                      </button>
                      <button
                        type="button"
                        className="rg-icon-btn"
                        onClick={() => setShowPassword((p) => !p)}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </Field>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {!email.trim() && !phone.trim() && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.78rem',
                        color: 'var(--primary, #991B1B)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 6,
                        background: 'var(--primary-subtle, rgba(153, 27, 27, 0.05))',
                        border: '1px solid rgba(153, 27, 27, 0.15)',
                        marginTop: '0.75rem',
                        width: '100%',
                      }}
                    >
                      <AlertCircle size={14} style={{ flexShrink: 0 }} />
                      <span>At least one of Email or Phone Number is required for account authentication.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                3. Role-Specific Information
               ══════════════════════════════════════════════════════════════ */}
            {role === 'student' && (
              <div className="rg-section">
                <div className="rg-section-header">
                  <GraduationCap size={15} style={{ color: 'var(--primary, #991B1B)' }} />
                  <h4 className="rg-section-title">Enrollment & Emergency Details</h4>
                </div>

                <div className="rg-grid">
                  <Field label="Admission Date" required>
                    <Input type="date" value={admissionDate} onChange={setAdmissionDate} required />
                  </Field>
                  <Field label="Previous School Attended" optional>
                    <Input value={previousSchool} onChange={setPreviousSchool} placeholder="e.g. St. Joseph School" />
                  </Field>
                </div>

                <div className="rg-grid">
                  <Field label="Residential Address" required className="rg-col-full">
                    <Input
                      value={address}
                      onChange={setAddress}
                      placeholder="e.g. Bole Subcity, Woreda 03, House #142, Addis Ababa"
                      required
                    />
                  </Field>
                </div>

                <div className="rg-section-header" style={{ marginTop: '0.5rem' }}>
                  <PhoneCall size={14} style={{ color: 'var(--primary, #991B1B)' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Emergency Guardian Contact
                  </span>
                </div>

                <div className="rg-grid">
                  <Field label="Contact Person Full Name" required>
                    <Input value={emergencyName} onChange={setEmergencyName} placeholder="e.g. Kebede Bekele" required />
                  </Field>
                  <Field label="Contact Mobile Phone" required>
                    <PhoneInput value={emergencyPhone} onChange={setEmergencyPhone} placeholder="911 234 567" required />
                  </Field>
                </div>
              </div>
            )}

            {role === 'parent' && (
              <div className="rg-section">
                <div className="rg-section-header">
                  <UserCheck size={15} style={{ color: 'var(--primary, #991B1B)' }} />
                  <h4 className="rg-section-title">Parent Background & Student Link</h4>
                </div>

                <div className="rg-grid">
                  <Field label="Occupation" optional>
                    <Input value={occupation} onChange={setOccupation} placeholder="e.g. Civil Engineer / Merchant" />
                  </Field>
                  <Field label="National ID / Kebele Card #" optional>
                    <Input value={nationalId} onChange={setNationalId} placeholder="e.g. ET-ID-9082314" />
                  </Field>
                </div>

                <div className="rg-grid">
                  <Field label="Residential Address" required className="rg-col-full">
                    <Input
                      value={parentAddress}
                      onChange={setParentAddress}
                      placeholder="e.g. Kirkos Subcity, House 502, Addis Ababa"
                      required
                    />
                  </Field>
                </div>

                <div className="rg-grid">
                  <Field
                    label="Link Student Number"
                    optional
                    hint="Directly link to student account (e.g. STU-2026-0001). Can also be linked later."
                  >
                    <Input
                      value={studentNumber}
                      onChange={setStudentNumber}
                      placeholder="STU-2026-XXXX"
                    />
                  </Field>

                  <Field label="Communication Priority">
                    <Select
                      value={isPrimary ? 'yes' : 'no'}
                      onChange={(v) => setIsPrimary(v === 'yes')}
                      options={[
                        { value: 'yes', label: 'Primary Contact (Emergency & Billing notices)' },
                        { value: 'no',  label: 'Secondary Contact' },
                      ]}
                    />
                  </Field>
                </div>
              </div>
            )}

            {role === 'teacher' && (
              <div className="rg-section">
                <div className="rg-section-header">
                  <BookOpen size={15} style={{ color: 'var(--primary, #991B1B)' }} />
                  <h4 className="rg-section-title">Academic & Faculty Information</h4>
                </div>

                <div className="rg-grid">
                  <Field label="Academic Qualification" required>
                    <Input
                      value={qualification}
                      onChange={setQualification}
                      placeholder="e.g. B.Ed in Mathematics / M.Sc Physics"
                      required
                    />
                  </Field>
                  <Field label="Primary Subject Specialization" optional>
                    <Input
                      value={specialization}
                      onChange={setSpecialization}
                      placeholder="e.g. Advanced Mathematics, Physics"
                    />
                  </Field>
                </div>

                <div className="rg-grid">
                  <Field label="Years of Experience" optional>
                    <Input
                      type="number"
                      value={yearsExp}
                      onChange={setYearsExp}
                      placeholder="e.g. 5"
                      min={0}
                    />
                  </Field>
                  <Field label="Official Hire Date" required>
                    <Input type="date" value={hireDate} onChange={setHireDate} required />
                  </Field>
                </div>
              </div>
            )}

            {role === 'staff' && (
              <div className="rg-section">
                <div className="rg-section-header">
                  <Briefcase size={15} style={{ color: 'var(--primary, #991B1B)' }} />
                  <h4 className="rg-section-title">Staff Role & Office Assignment</h4>
                </div>

                <div className="rg-grid">
                  <Field label="Assigned System Role" required>
                    <Select
                      value={staffRole}
                      onChange={setStaffRole}
                      options={STAFF_ROLES.map((v) => ({ value: v, label: v }))}
                      required
                    />
                  </Field>
                  <Field label="Department / Division" optional>
                    <Input
                      value={department}
                      onChange={setDepartment}
                      placeholder="e.g. Academic Registry / Finance / General Admin"
                    />
                  </Field>
                </div>

                <div className="rg-grid">
                  <Field label="Office Location / Room" optional>
                    <Input
                      value={office}
                      onChange={setOffice}
                      placeholder="e.g. Main Admin Building, Room 204"
                    />
                  </Field>
                  <Field label="Official Hire Date" required>
                    <Input type="date" value={staffHireDate} onChange={setStaffHireDate} required />
                  </Field>
                </div>
              </div>
            )}
          </div>

          {/* ── Submit Action Bar ── */}
          <div className="rg-submit-bar">
            <div className="rg-submit-left">
              <span>Fields marked with <strong style={{ color: 'var(--primary, #991B1B)' }}>*</strong> are mandatory</span>
            </div>

            <div className="rg-submit-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={resetForm}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-prim"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', minWidth: 160, justifyContent: 'center' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Registering…</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Register {activeRoleObj.label}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
