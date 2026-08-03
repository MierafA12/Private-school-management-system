const pool       = require('../db');
const { hashPassword } = require('./authService');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: resolve role id by name
// ─────────────────────────────────────────────────────────────────────────────
const getRoleId = async (roleName) => {
  const { rows } = await pool.query(
    `SELECT id FROM roles WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    [roleName]
  );
  if (!rows.length) {
    const err = new Error(`Role "${roleName}" not found.`);
    err.status = 400;
    throw err;
  }
  return rows[0].id;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: generate sequential numbers
// ─────────────────────────────────────────────────────────────────────────────
const generateStudentNumber = async (client) => {
  const year = new Date().getFullYear();
  const { rows } = await client.query(
    `SELECT COUNT(*) AS cnt FROM students
     WHERE EXTRACT(YEAR FROM created_at) = $1`, [year]
  );
  const seq = String(parseInt(rows[0].cnt) + 1).padStart(4, '0');
  return `STU-${year}-${seq}`;
};

const generateAdmissionNumber = async (client) => {
  const year = new Date().getFullYear();
  const { rows } = await client.query(
    `SELECT COUNT(*) AS cnt FROM students
     WHERE EXTRACT(YEAR FROM admission_date) = $1`, [year]
  );
  const seq = String(parseInt(rows[0].cnt) + 1).padStart(4, '0');
  return `ADM-${year}-${seq}`;
};

const generateEmployeeNumber = async (client, table) => {
  const prefix = table === 'teachers' ? 'TCH' : 'STF';
  const { rows } = await client.query(`SELECT COUNT(*) AS cnt FROM ${table}`);
  const seq = String(parseInt(rows[0].cnt) + 1).padStart(4, '0');
  return `${prefix}-${seq}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER STUDENT
// Body fields: first_name, last_name, middle_name?, gender, date_of_birth,
//              email, phone?, password, address, emergency_contact_name,
//              emergency_contact_phone, admission_date, previous_school?,
//              blood_group?, nationality?, religion?
// ─────────────────────────────────────────────────────────────────────────────
const registerStudent = async (fields) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const roleId = await getRoleId('Student');
    const hash   = await hashPassword(fields.password);

    // Create user account
    const { rows: userRows } = await client.query(
      `INSERT INTO users (role_id, email, phone, password_hash, status)
       VALUES ($1, $2, $3, $4, 'ACTIVE')
       RETURNING id`,
      [roleId, fields.email?.toLowerCase() || null, fields.phone || null, hash]
    );
    const userId = userRows[0].id;

    const studentNumber   = await generateStudentNumber(client);
    const admissionNumber = await generateAdmissionNumber(client);

    // Create student profile
    const { rows: stuRows } = await client.query(
      `INSERT INTO students
         (user_id, student_number, admission_number,
          first_name, middle_name, last_name, gender, date_of_birth,
          blood_group, nationality, religion,
          address, emergency_contact_name, emergency_contact_phone,
          admission_date, previous_school, current_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'ACTIVE')
       RETURNING *`,
      [
        userId, studentNumber, admissionNumber,
        fields.first_name, fields.middle_name || null, fields.last_name,
        fields.gender, fields.date_of_birth,
        fields.blood_group || null, fields.nationality || null, fields.religion || null,
        fields.address, fields.emergency_contact_name, fields.emergency_contact_phone,
        fields.admission_date, fields.previous_school || null,
      ]
    );

    await client.query('COMMIT');
    return {
      user_id:          userId,
      student_number:   studentNumber,
      admission_number: admissionNumber,
      ...stuRows[0],
      email: fields.email,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER PARENT
// Body fields: first_name, last_name, middle_name?, gender?, relationship,
//              email, phone?, password, address, occupation?, employer?,
//              national_id?, emergency_phone?
// ─────────────────────────────────────────────────────────────────────────────
const registerParent = async (fields) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const roleId = await getRoleId('Parent');
    const hash   = await hashPassword(fields.password);

    const { rows: userRows } = await client.query(
      `INSERT INTO users (role_id, email, phone, password_hash, status)
       VALUES ($1, $2, $3, $4, 'ACTIVE')
       RETURNING id`,
      [roleId, fields.email?.toLowerCase() || null, fields.phone || null, hash]
    );
    const userId = userRows[0].id;

    const { rows: parRows } = await client.query(
      `INSERT INTO parents
         (user_id, first_name, middle_name, last_name, gender, relationship,
          occupation, employer, national_id, address, emergency_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        userId,
        fields.first_name, fields.middle_name || null, fields.last_name,
        fields.gender || null, fields.relationship,
        fields.occupation || null, fields.employer || null,
        fields.national_id || null, fields.address,
        fields.emergency_phone || null,
      ]
    );

    // Optionally link to a student by student_number
    if (fields.student_number) {
      const { rows: stu } = await client.query(
        `SELECT id FROM students WHERE student_number = $1`, [fields.student_number]
      );
      if (stu.length) {
        await client.query(
          `INSERT INTO student_parents (student_id, parent_id, is_primary_contact)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [stu[0].id, parRows[0].id, fields.is_primary_contact ?? true]
        );
      }
    }

    await client.query('COMMIT');
    return { user_id: userId, ...parRows[0], email: fields.email };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER TEACHER
// Body fields: first_name, last_name, middle_name?, gender, date_of_birth?,
//              qualification, specialization?, years_of_experience?,
//              email, phone?, password, address?, hire_date
// ─────────────────────────────────────────────────────────────────────────────
const registerTeacher = async (fields) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const roleId = await getRoleId('Teacher');
    const hash   = await hashPassword(fields.password);

    const { rows: userRows } = await client.query(
      `INSERT INTO users (role_id, email, phone, password_hash, status)
       VALUES ($1, $2, $3, $4, 'ACTIVE')
       RETURNING id`,
      [roleId, fields.email?.toLowerCase() || null, fields.phone || null, hash]
    );
    const userId = userRows[0].id;

    const employeeNumber = await generateEmployeeNumber(client, 'teachers');

    const { rows: tchRows } = await client.query(
      `INSERT INTO teachers
         (user_id, employee_number, first_name, middle_name, last_name,
          gender, date_of_birth, qualification, specialization,
          years_of_experience, phone_number, address, hire_date, employment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'ACTIVE')
       RETURNING *`,
      [
        userId, employeeNumber,
        fields.first_name, fields.middle_name || null, fields.last_name,
        fields.gender, fields.date_of_birth || null,
        fields.qualification, fields.specialization || null,
        fields.years_of_experience || 0,
        fields.phone || null, fields.address || null,
        fields.hire_date,
      ]
    );

    await client.query('COMMIT');
    return { user_id: userId, employee_number: employeeNumber, ...tchRows[0], email: fields.email };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER STAFF  (Registrar, Accountant, Principal, etc.)
// Body fields: first_name, last_name, middle_name?, gender, role_name,
//              email, phone?, password, hire_date, department?, office_location?,
//              address?, date_of_birth?
// ─────────────────────────────────────────────────────────────────────────────
const registerStaff = async (fields) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const roleId = await getRoleId(fields.role_name);
    const hash   = await hashPassword(fields.password);

    const { rows: userRows } = await client.query(
      `INSERT INTO users (role_id, email, phone, password_hash, status)
       VALUES ($1, $2, $3, $4, 'ACTIVE')
       RETURNING id`,
      [roleId, fields.email?.toLowerCase() || null, fields.phone || null, hash]
    );
    const userId = userRows[0].id;

    const employeeNumber = await generateEmployeeNumber(client, 'staff');

    const { rows: stfRows } = await client.query(
      `INSERT INTO staff
         (user_id, employee_number, first_name, middle_name, last_name,
          gender, date_of_birth, phone_number, address,
          department, office_location, hire_date, employment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'ACTIVE')
       RETURNING *`,
      [
        userId, employeeNumber,
        fields.first_name, fields.middle_name || null, fields.last_name,
        fields.gender, fields.date_of_birth || null,
        fields.phone || null, fields.address || null,
        fields.department || null, fields.office_location || null,
        fields.hire_date,
      ]
    );

    await client.query('COMMIT');
    return { user_id: userId, employee_number: employeeNumber, ...stfRows[0], email: fields.email };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LIST all registered users (paginated)
// ─────────────────────────────────────────────────────────────────────────────
const listUsers = async ({ role, search, limit = 30, offset = 0 }) => {
  const conditions = ['1=1'];
  const params     = [];
  let   p          = 1;

  if (role) {
    conditions.push(`r.name = $${p++}`);
    params.push(role);
  }
  if (search) {
    conditions.push(
      `(LOWER(u.email) LIKE $${p} OR LOWER(COALESCE(s.first_name,'') || ' ' || COALESCE(s.last_name,'')) LIKE $${p}
        OR LOWER(COALESCE(t.first_name,'') || ' ' || COALESCE(t.last_name,'')) LIKE $${p}
        OR LOWER(COALESCE(par.first_name,'') || ' ' || COALESCE(par.last_name,'')) LIKE $${p}
        OR LOWER(COALESCE(stf.first_name,'') || ' ' || COALESCE(stf.last_name,'')) LIKE $${p})`
    );
    params.push(`%${search.toLowerCase()}%`);
    p++;
  }

  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT
       u.id,
       u.email,
       u.phone,
       u.status,
       u.created_at,
       r.name AS role,
       COALESCE(
         s.first_name   || ' ' || s.last_name,
         t.first_name   || ' ' || t.last_name,
         par.first_name || ' ' || par.last_name,
         stf.first_name || ' ' || stf.last_name,
         u.email
       ) AS full_name,
       COALESCE(s.student_number,  t.employee_number, stf.employee_number) AS id_number,
       s.current_status AS student_status,
       t.employment_status AS teacher_status,
       stf.employment_status AS staff_status
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN students s   ON s.user_id  = u.id
     LEFT JOIN teachers t   ON t.user_id  = u.id
     LEFT JOIN parents  par ON par.user_id = u.id
     LEFT JOIN staff    stf ON stf.user_id = u.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY u.created_at DESC
     LIMIT $${p++} OFFSET $${p++}`,
    params
  );

  // total count
  const countParams = params.slice(0, -2);
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) AS total
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN students s   ON s.user_id  = u.id
     LEFT JOIN teachers t   ON t.user_id  = u.id
     LEFT JOIN parents  par ON par.user_id = u.id
     LEFT JOIN staff    stf ON stf.user_id = u.id
     WHERE ${conditions.join(' AND ')}`,
    countParams
  );

  return { users: rows, total: parseInt(countRows[0].total), limit, offset };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET single user detail
// ─────────────────────────────────────────────────────────────────────────────
const getUserById = async (userId) => {
  const { rows } = await pool.query(
    `SELECT
       u.id, u.email, u.phone, u.status, u.created_at, u.last_login,
       r.name AS role,
       s.*,
       t.employee_number AS teacher_employee_number,
       t.qualification, t.specialization, t.hire_date AS teacher_hire_date,
       t.employment_status AS teacher_status,
       par.relationship, par.occupation,
       stf.employee_number AS staff_employee_number,
       stf.department, stf.hire_date AS staff_hire_date,
       stf.employment_status AS staff_status
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN students s   ON s.user_id  = u.id
     LEFT JOIN teachers t   ON t.user_id  = u.id
     LEFT JOIN parents  par ON par.user_id = u.id
     LEFT JOIN staff    stf ON stf.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );
  return rows[0] || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// RESET a user's password (registrar action)
// ─────────────────────────────────────────────────────────────────────────────
const resetUserPassword = async (userId, newPassword) => {
  const hash = await hashPassword(newPassword);
  await pool.query(
    `UPDATE users
     SET password_hash       = $1,
         password_changed_at = NOW(),
         failed_login_attempts = 0,
         status              = 'ACTIVE',
         updated_at          = NOW()
     WHERE id = $2`,
    [hash, userId]
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE user status (activate / deactivate)
// ─────────────────────────────────────────────────────────────────────────────
const setUserStatus = async (userId, status) => {
  const allowed = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED'];
  if (!allowed.includes(status)) {
    const err = new Error(`Invalid status "${status}".`); err.status = 400; throw err;
  }
  await pool.query(
    `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, userId]
  );
};

module.exports = {
  registerStudent,
  registerParent,
  registerTeacher,
  registerStaff,
  listUsers,
  getUserById,
  resetUserPassword,
  setUserStatus,
};
