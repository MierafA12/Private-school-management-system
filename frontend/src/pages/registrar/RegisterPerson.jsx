import { useState } from 'react';
import { GraduationCap, UserCheck, BookOpen, Briefcase, RotateCcw } from 'lucide-react';
import { registrarApi } from '../../api';
import { ErrorBanner } from '../../components/shared/PageState';
import './registrar.css';

const ROLES = [
  { key: 'student',   label: 'Student',    icon: GraduationCap },
  { key: 'parent',    label: 'Parent',     icon: UserCheck     },
  { key: 'teacher',   label: 'Teacher',    icon: BookOpen      },
  { key: 'staff',     label: 'Staff',      icon: Briefcase     },
];

const STAFF_ROLES = ['Registrar', 'Accountant', 'Principal', 'Super Admin'];

// ─── Tiny field component ─────────────────────────────────────────────────────
function Field({ label, required, hint, children }) {
  return (
    <div className="rg-field">
      <label className="rg-label">
        {label} {required && <span>*</span>}
      </label>
      {children}
      {hint && <span className="rg-hint">{hint}</span>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', ...rest }) {
  return (
    <input
      className="rg-input"
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      {...rest}
    />
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select className="rg-select" value={value} onChange={e => onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  );
}

// ─── Success card ─────────────────────────────────────────────────────────────
function SuccessCard({ result, role, onAgain }) {
  const creds = [
    result.student_number   && ['Student Number',   result.student_number],
    result.admission_number && ['Admission Number', result.admission_number],
    result.employee_number  && ['Employee Number',  result.employee_number],
    result.email            && ['Email',            result.email],
    result.phone            && ['Phone',            result.phone],
  ].filter(Boolean);

  return (
    <div className="rg-success">
      <div className="rg-success-icon">✅</div>
      <h3>{role.charAt(0).toUpperCase() + role.slice(1)} Registered Successfully</h3>
      <p>
        The account has been created. The user can log in immediately using their email/phone and the password you set.
      </p>
      <div className="rg-cred-box">
        {creds.map(([k, v]) => (
          <div className="rg-cred-row" key={k}>
            <span className="rg-cred-key">{k}</span>
            <span className="rg-cred-value">{v}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onAgain}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.65rem 1.25rem', background: 'var(--primary)',
          color: 'white', borderRadius: 10, fontWeight: 600, fontSize: '0.875rem',
          marginTop: '0.5rem',
        }}
      >
        <RotateCcw size={16} /> Register Another
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function RegisterPerson() {
  const [role,    setRole]    = useState('student');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [result,  setResult]  = useState(null);

  // ── Shared fields ────────────────────────────────────────────────────────
  const [firstName,  setFirstName]  = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName,   setLastName]   = useState('');
  const [gender,     setGender]     = useState('');
  const [email,      setEmail]      = useState('');
  const [phone,      setPhone]      = useState('');
  const [password,   setPassword]   = useState('');

  // ── Student-only ─────────────────────────────────────────────────────────
  const [dob,                setDob]                = useState('');
  const [address,            setAddress]            = useState('');
  const [emergencyName,      setEmergencyName]      = useState('');
  const [emergencyPhone,     setEmergencyPhone]     = useState('');
  const [admissionDate,      setAdmissionDate]      = useState('');
  const [previousSchool,     setPreviousSchool]     = useState('');
  const [bloodGroup,         setBloodGroup]         = useState('');
  const [nationality,        setNationality]        = useState('');
  const [religion,           setReligion]           = useState('');

  // ── Parent-only ──────────────────────────────────────────────────────────
  const [relationship,       setRelationship]       = useState('');
  const [parentAddress,      setParentAddress]      = useState('');
  const [occupation,         setOccupation]         = useState('');
  const [nationalId,         setNationalId]         = useState('');
  const [studentNumber,      setStudentNumber]      = useState('');
  const [isPrimary,          setIsPrimary]          = useState(true);

  // ── Teacher-only ─────────────────────────────────────────────────────────
  const [qualification,      setQualification]      = useState('');
  const [specialization,     setSpecialization]     = useState('');
  const [yearsExp,           setYearsExp]           = useState('');
  const [hireDate,           setHireDate]           = useState('');
  const [teacherDob,         setTeacherDob]         = useState('');

  // ── Staff-only ───────────────────────────────────────────────────────────
  const [staffRole,          setStaffRole]          = useState('Registrar');
  const [department,         setDepartment]         = useState('');
  const [office,             setOffice]             = useState('');
  const [staffHireDate,      setStaffHireDate]      = useState('');
  const [staffDob,           setStaffDob]           = useState('');

  const resetForm = () => {
    setFirstName(''); setMiddleName(''); setLastName(''); setGender('');
    setEmail(''); setPhone(''); setPassword('');
    setDob(''); setAddress(''); setEmergencyName(''); setEmergencyPhone('');
    setAdmissionDate(''); setPreviousSchool(''); setBloodGroup(''); setNationality(''); setReligion('');
    setRelationship(''); setParentAddress(''); setOccupation(''); setNationalId(''); setStudentNumber(''); setIsPrimary(true);
    setQualification(''); setSpecialization(''); setYearsExp(''); setHireDate(''); setTeacherDob('');
    setStaffRole('Registrar'); setDepartment(''); setOffice(''); setStaffHireDate(''); setStaffDob('');
    setResult(null); setError(null);
  };

  const handleRoleChange = (r) => { setRole(r); resetForm(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          years_of_experience: yearsExp ? parseInt(yearsExp) : 0,
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
      setResult(res);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div>
        <div className="sp-page-header">
          <h1 className="sp-page-title">Register User</h1>
        </div>
        <SuccessCard result={result} role={role} onAgain={resetForm} />
      </div>
    );
  }

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Register New User</h1>
        <p className="sp-page-sub">Create an account — the user can log in immediately after registration</p>
      </div>

      {/* Role selector */}
      <div className="rg-role-tabs">
        {ROLES.map(({ key, label, icon: Icon }) => (
          <button
            type="button"
            key={key}
            className={`rg-role-tab${role === key ? ' active' : ''}`}
            onClick={() => handleRoleChange(key)}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="rg-form-card">
          <div className="rg-form-header">
            <span style={{ fontSize: '1rem', fontWeight: 700 }}>
              {role === 'student' ? '🎓' : role === 'parent' ? '👨‍👩‍👧' : role === 'teacher' ? '📖' : '🏢'}
              &nbsp; {role.charAt(0).toUpperCase() + role.slice(1)} Registration
            </span>
          </div>

          <div className="rg-form-body">
            {error && <div style={{ marginBottom: '1rem' }}><ErrorBanner message={error} /></div>}

            {/* ── Personal Info ──────────────────────────────────────────── */}
            <div className="rg-section-title">Personal Information</div>
            <div className="rg-grid">
              <Field label="First Name" required>
                <Input value={firstName} onChange={setFirstName} placeholder="e.g. John" required />
              </Field>
              <Field label="Last Name" required>
                <Input value={lastName} onChange={setLastName} placeholder="e.g. Doe" required />
              </Field>
              <Field label="Middle Name">
                <Input value={middleName} onChange={setMiddleName} placeholder="Optional" />
              </Field>
              <Field label="Gender" required={role !== 'parent'}>
                <Select
                  value={gender} onChange={setGender}
                  placeholder="— Select —"
                  options={['Male','Female','Other'].map(v => ({ value: v, label: v }))}
                />
              </Field>

              {role === 'student' && (
                <Field label="Date of Birth" required>
                  <Input type="date" value={dob} onChange={setDob} required />
                </Field>
              )}
              {role === 'teacher' && (
                <Field label="Date of Birth">
                  <Input type="date" value={teacherDob} onChange={setTeacherDob} />
                </Field>
              )}
              {role === 'staff' && (
                <Field label="Date of Birth">
                  <Input type="date" value={staffDob} onChange={setStaffDob} />
                </Field>
              )}

              {role === 'student' && <>
                <Field label="Blood Group">
                  <Select value={bloodGroup} onChange={setBloodGroup} placeholder="— Optional —"
                    options={['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(v => ({ value: v, label: v }))} />
                </Field>
                <Field label="Nationality">
                  <Input value={nationality} onChange={setNationality} placeholder="e.g. Kenyan" />
                </Field>
                <Field label="Religion">
                  <Input value={religion} onChange={setReligion} placeholder="e.g. Christian" />
                </Field>
              </>}
            </div>

            {/* ── Account credentials ────────────────────────────────────── */}
            <div className="rg-section-title">Login Credentials</div>
            <div className="rg-grid">
              <Field label="Email Address" hint="Used to log in">
                <Input type="email" value={email} onChange={setEmail} placeholder="user@school.com" />
              </Field>
              <Field label="Phone Number" hint="Alternative login">
                <Input type="tel" value={phone} onChange={setPhone} placeholder="+254700000000" />
              </Field>
              <Field label="Password" required hint="Min 6 characters — user can change after login">
                <Input type="password" value={password} onChange={setPassword} placeholder="••••••••" required minLength={6} />
              </Field>
            </div>
            {!email && !phone && (
              <p style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                ⚠️ At least one of email or phone is required.
              </p>
            )}

            {/* ── Student-specific ────────────────────────────────────────── */}
            {role === 'student' && <>
              <div className="rg-section-title">Enrollment & Address</div>
              <div className="rg-grid">
                <Field label="Admission Date" required>
                  <Input type="date" value={admissionDate} onChange={setAdmissionDate} required />
                </Field>
                <Field label="Previous School">
                  <Input value={previousSchool} onChange={setPreviousSchool} placeholder="Optional" />
                </Field>
                <Field label="Home Address" required className="rg-col-full">
                  <Input value={address} onChange={setAddress} placeholder="Street, City" required />
                </Field>
              </div>

              <div className="rg-section-title">Emergency Contact</div>
              <div className="rg-grid">
                <Field label="Contact Name" required>
                  <Input value={emergencyName} onChange={setEmergencyName} placeholder="e.g. Jane Doe" required />
                </Field>
                <Field label="Contact Phone" required>
                  <Input type="tel" value={emergencyPhone} onChange={setEmergencyPhone} placeholder="+254..." required />
                </Field>
              </div>
            </>}

            {/* ── Parent-specific ─────────────────────────────────────────── */}
            {role === 'parent' && <>
              <div className="rg-section-title">Parent Details</div>
              <div className="rg-grid">
                <Field label="Relationship" required>
                  <Select value={relationship} onChange={setRelationship} placeholder="— Select —"
                    options={['Father','Mother','Guardian','Sibling','Other'].map(v => ({ value: v, label: v }))} />
                </Field>
                <Field label="Occupation">
                  <Input value={occupation} onChange={setOccupation} placeholder="e.g. Engineer" />
                </Field>
                <Field label="National ID">
                  <Input value={nationalId} onChange={setNationalId} placeholder="ID number" />
                </Field>
                <Field label="Home Address" required>
                  <Input value={parentAddress} onChange={setParentAddress} placeholder="Street, City" required />
                </Field>
              </div>

              <div className="rg-section-title">Link to Student (Optional)</div>
              <div className="rg-grid">
                <Field label="Student Number" hint="e.g. STU-2026-0001 — leave blank to link later">
                  <Input value={studentNumber} onChange={setStudentNumber} placeholder="STU-YYYY-XXXX" />
                </Field>
                <Field label="Primary Contact">
                  <Select value={isPrimary ? 'yes' : 'no'} onChange={v => setIsPrimary(v === 'yes')}
                    options={[{ value: 'yes', label: 'Yes — Primary contact' }, { value: 'no', label: 'No — Secondary contact' }]} />
                </Field>
              </div>
            </>}

            {/* ── Teacher-specific ────────────────────────────────────────── */}
            {role === 'teacher' && <>
              <div className="rg-section-title">Professional Information</div>
              <div className="rg-grid">
                <Field label="Qualification" required>
                  <Input value={qualification} onChange={setQualification} placeholder="e.g. B.Ed Mathematics" required />
                </Field>
                <Field label="Specialization">
                  <Input value={specialization} onChange={setSpecialization} placeholder="e.g. Mathematics, Physics" />
                </Field>
                <Field label="Years of Experience">
                  <Input type="number" value={yearsExp} onChange={setYearsExp} placeholder="0" min={0} />
                </Field>
                <Field label="Hire Date" required>
                  <Input type="date" value={hireDate} onChange={setHireDate} required />
                </Field>
              </div>
            </>}

            {/* ── Staff-specific ───────────────────────────────────────────── */}
            {role === 'staff' && <>
              <div className="rg-section-title">Staff Details</div>
              <div className="rg-grid">
                <Field label="Staff Role" required>
                  <Select value={staffRole} onChange={setStaffRole}
                    options={STAFF_ROLES.map(v => ({ value: v, label: v }))} />
                </Field>
                <Field label="Department">
                  <Input value={department} onChange={setDepartment} placeholder="e.g. Administration" />
                </Field>
                <Field label="Office Location">
                  <Input value={office} onChange={setOffice} placeholder="e.g. Block A, Room 2" />
                </Field>
                <Field label="Hire Date" required>
                  <Input type="date" value={staffHireDate} onChange={setStaffHireDate} required />
                </Field>
              </div>
            </>}
          </div>

          {/* Submit bar */}
          <div className="rg-submit-bar">
            <button
              type="button"
              onClick={resetForm}
              style={{
                padding: '0.65rem 1.25rem', borderRadius: 10,
                border: '1px solid var(--border-color)', background: 'white',
                fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-muted)',
              }}
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.65rem 1.5rem', borderRadius: 10,
                background: loading ? '#FECACA' : 'var(--primary)',
                color: 'white', fontWeight: 700, fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}
            >
              {loading
                ? <><span style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Registering…</>
                : `✓ Register ${role.charAt(0).toUpperCase() + role.slice(1)}`
              }
            </button>
          </div>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
