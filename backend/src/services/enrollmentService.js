const pool = require('../db');

// ─────────────────────────────────────────────────────────────────────────────
// LIST enrollments — paginated, filterable
// ─────────────────────────────────────────────────────────────────────────────
const listEnrollments = async ({ academic_year_id, class_id, section_id, search, status, limit = 30, offset = 0 }) => {
  const conditions = ['1=1'];
  const params     = [];
  let   p          = 1;

  if (academic_year_id) { conditions.push(`e.academic_year_id = $${p++}`); params.push(academic_year_id); }
  if (class_id)         { conditions.push(`e.class_id = $${p++}`);         params.push(class_id); }
  if (section_id)       { conditions.push(`e.section_id = $${p++}`);       params.push(section_id); }
  if (status)           { conditions.push(`e.enrollment_status = $${p++}`);params.push(status); }
  if (search) {
    conditions.push(
      `(LOWER(s.first_name || ' ' || s.last_name) LIKE $${p} OR s.student_number LIKE $${p} OR s.admission_number LIKE $${p})`
    );
    params.push(`%${search.toLowerCase()}%`);
    p++;
  }

  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT
       e.id               AS enrollment_id,
       e.roll_number,
       e.enrollment_date,
       e.enrollment_status,
       e.created_at,
       s.id               AS student_id,
       s.student_number,
       s.admission_number,
       s.first_name,
       s.last_name,
       s.gender,
       ay.name            AS academic_year,
       c.name             AS class_name,
       sec.name           AS section_name
     FROM enrollments e
     JOIN students      s   ON s.id   = e.student_id
     JOIN academic_years ay ON ay.id  = e.academic_year_id
     JOIN classes        c  ON c.id   = e.class_id
     JOIN sections       sec ON sec.id = e.section_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY c.grade_level, sec.name, s.last_name, s.first_name
     LIMIT $${p++} OFFSET $${p++}`,
    params
  );

  const countParams = params.slice(0, -2);
  const { rows: cnt } = await pool.query(
    `SELECT COUNT(*) AS total
     FROM enrollments e
     JOIN students      s   ON s.id   = e.student_id
     JOIN academic_years ay ON ay.id  = e.academic_year_id
     JOIN classes        c  ON c.id   = e.class_id
     JOIN sections       sec ON sec.id = e.section_id
     WHERE ${conditions.join(' AND ')}`,
    countParams
  );

  return { enrollments: rows, total: parseInt(cnt[0].total), limit, offset };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET single enrollment
// ─────────────────────────────────────────────────────────────────────────────
const getEnrollmentById = async (id) => {
  const { rows } = await pool.query(
    `SELECT
       e.*,
       s.first_name, s.last_name, s.student_number, s.admission_number, s.gender, s.date_of_birth,
       ay.name AS academic_year,
       c.name  AS class_name,
       sec.name AS section_name, sec.room_number
     FROM enrollments e
     JOIN students      s   ON s.id   = e.student_id
     JOIN academic_years ay ON ay.id  = e.academic_year_id
     JOIN classes        c  ON c.id   = e.class_id
     JOIN sections       sec ON sec.id = e.section_id
     WHERE e.id = $1`,
    [id]
  );
  return rows[0] || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE enrollment
// Fields: student_id, academic_year_id, class_id, section_id,
//         enrollment_date, roll_number?
// ─────────────────────────────────────────────────────────────────────────────
const createEnrollment = async (fields) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Guard: student must exist and be ACTIVE
    const { rows: stu } = await client.query(
      `SELECT id, current_status FROM students WHERE id = $1`, [fields.student_id]
    );
    if (!stu.length) {
      const err = new Error('Student not found.'); err.status = 404; throw err;
    }

    // Guard: no duplicate enrollment for same student + academic year
    const { rows: dup } = await client.query(
      `SELECT id FROM enrollments WHERE student_id = $1 AND academic_year_id = $2`,
      [fields.student_id, fields.academic_year_id]
    );
    if (dup.length) {
      const err = new Error('Student is already enrolled for this academic year.'); err.status = 409; throw err;
    }

    // Auto-generate roll number if not provided
    let rollNumber = fields.roll_number || null;
    if (!rollNumber) {
      const { rows: cnt } = await client.query(
        `SELECT COUNT(*) AS cnt FROM enrollments
         WHERE section_id = $1 AND academic_year_id = $2`,
        [fields.section_id, fields.academic_year_id]
      );
      rollNumber = String(parseInt(cnt[0].cnt) + 1).padStart(3, '0');
    }

    const { rows } = await client.query(
      `INSERT INTO enrollments
         (student_id, academic_year_id, class_id, section_id,
          roll_number, enrollment_date, enrollment_status)
       VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE')
       RETURNING *`,
      [
        fields.student_id, fields.academic_year_id,
        fields.class_id, fields.section_id,
        rollNumber, fields.enrollment_date,
      ]
    );

    await client.query('COMMIT');
    return getEnrollmentById(rows[0].id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE enrollment (change section, status, roll number)
// ─────────────────────────────────────────────────────────────────────────────
const updateEnrollment = async (id, fields) => {
  const { rows } = await pool.query(
    `UPDATE enrollments
     SET class_id          = COALESCE($1, class_id),
         section_id        = COALESCE($2, section_id),
         roll_number       = COALESCE($3, roll_number),
         enrollment_status = COALESCE($4, enrollment_status),
         updated_at        = NOW()
     WHERE id = $5
     RETURNING *`,
    [fields.class_id, fields.section_id, fields.roll_number, fields.enrollment_status, id]
  );
  if (!rows.length) return null;
  return getEnrollmentById(rows[0].id);
};

// ─────────────────────────────────────────────────────────────────────────────
// PROMOTE students — create new enrollments in next academic year
// Accepts array of { student_id, new_class_id, new_section_id, from_enrollment_id }
// ─────────────────────────────────────────────────────────────────────────────
const promoteStudents = async ({ academic_year_id, enrollment_date, promotions }) => {
  const client = await pool.connect();
  const results = { success: [], failed: [] };

  try {
    await client.query('BEGIN');

    for (const p of promotions) {
      try {
        // Check for duplicate in target year
        const { rows: dup } = await client.query(
          `SELECT id FROM enrollments WHERE student_id = $1 AND academic_year_id = $2`,
          [p.student_id, academic_year_id]
        );
        if (dup.length) {
          results.failed.push({ student_id: p.student_id, reason: 'Already enrolled in target year.' });
          continue;
        }

        // Roll number in new section
        const { rows: cnt } = await client.query(
          `SELECT COUNT(*) AS cnt FROM enrollments WHERE section_id = $1 AND academic_year_id = $2`,
          [p.new_section_id, academic_year_id]
        );
        const rollNumber = String(parseInt(cnt[0].cnt) + 1).padStart(3, '0');

        await client.query(
          `INSERT INTO enrollments
             (student_id, academic_year_id, class_id, section_id,
              roll_number, enrollment_date, enrollment_status, promoted_from_enrollment_id)
           VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE',$7)`,
          [
            p.student_id, academic_year_id,
            p.new_class_id, p.new_section_id,
            rollNumber, enrollment_date,
            p.from_enrollment_id || null,
          ]
        );

        // Mark old enrollment as GRADUATED or PROMOTED
        if (p.from_enrollment_id) {
          await client.query(
            `UPDATE enrollments SET enrollment_status = 'GRADUATED', updated_at = NOW() WHERE id = $1`,
            [p.from_enrollment_id]
          );
        }

        results.success.push(p.student_id);
      } catch (innerErr) {
        results.failed.push({ student_id: p.student_id, reason: innerErr.message });
      }
    }

    await client.query('COMMIT');
    return results;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET unenrolled students (for current academic year)
// ─────────────────────────────────────────────────────────────────────────────
const getUnenrolledStudents = async (academicYearId, search) => {
  const params = [academicYearId];
  let searchClause = '';
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    searchClause = `AND (LOWER(s.first_name || ' ' || s.last_name) LIKE $2 OR s.student_number LIKE $2)`;
  }

  const { rows } = await pool.query(
    `SELECT s.id, s.student_number, s.admission_number,
            s.first_name, s.last_name, s.gender, s.date_of_birth
     FROM students s
     WHERE s.current_status = 'ACTIVE'
       ${searchClause}
       AND s.id NOT IN (
         SELECT e.student_id FROM enrollments e WHERE e.academic_year_id = $1
       )
     ORDER BY s.last_name, s.first_name
     LIMIT 50`,
    params
  );
  return rows;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET enrollment options (academic years, classes, sections)
// ─────────────────────────────────────────────────────────────────────────────
const getEnrollmentOptions = async () => {
  const [years, classes] = await Promise.all([
    pool.query(`SELECT id, name, is_current FROM academic_years ORDER BY start_date DESC`),
    pool.query(
      `SELECT c.id, c.name, c.grade_level,
         json_agg(json_build_object('id', s.id, 'name', s.name, 'room_number', s.room_number, 'capacity', s.capacity)
                  ORDER BY s.name) AS sections
       FROM classes c
       JOIN sections s ON s.class_id = c.id
       GROUP BY c.id, c.name, c.grade_level
       ORDER BY c.grade_level, c.name`
    ),
  ]);

  return {
    academic_years: years.rows,
    classes:        classes.rows,
  };
};

module.exports = {
  listEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollment,
  promoteStudents,
  getUnenrolledStudents,
  getEnrollmentOptions,
};
