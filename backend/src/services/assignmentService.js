const pool = require('../db');

// ═════════════════════════════════════════════════════════════════════════════
// ASSIGNMENTS (teacher CRUD)
// ═════════════════════════════════════════════════════════════════════════════

const listAssignments = async ({ teacherId, classId, sectionId, termId, status } = {}) => {
  const conds = ['1=1'];
  const vals  = [];
  let   p     = 1;

  if (teacherId) { conds.push(`a.teacher_id = $${p++}`);                     vals.push(teacherId); }
  if (classId)   { conds.push(`a.class_id   = $${p++}`);                     vals.push(classId);   }
  if (sectionId) { conds.push(`a.section_id = $${p++}`);                     vals.push(sectionId); }
  if (termId)    { conds.push(`a.term_id    = $${p++}`);                     vals.push(termId);    }
  if (status)    { conds.push(`a.status     = $${p++}`);                     vals.push(status);    }

  const { rows } = await pool.query(
    `SELECT
       a.*,
       sub.name AS subject_name, sub.code AS subject_code,
       c.name   AS class_name,   sec.name AS section_name,
       t.name   AS term_name,
       (te.first_name || ' ' || te.last_name) AS teacher_name,
       (SELECT COUNT(*) FROM assignment_submissions s WHERE s.assignment_id = a.id) AS submission_count,
       (SELECT COUNT(*) FROM assignment_groups     g WHERE g.assignment_id = a.id) AS group_count
     FROM assignments a
     JOIN curriculum_subjects cs ON cs.id = a.curriculum_subject_id
     JOIN subjects sub ON sub.id = cs.subject_id
     JOIN classes  c   ON c.id  = a.class_id
     JOIN sections sec ON sec.id = a.section_id
     JOIN terms    t   ON t.id  = a.term_id
     JOIN teachers te  ON te.id = a.teacher_id
     WHERE ${conds.join(' AND ')}
     ORDER BY a.due_date ASC NULLS LAST, a.created_at DESC`,
    vals
  );
  return rows;
};

const getAssignmentById = async (id) => {
  const { rows: a } = await pool.query(
    `SELECT
       a.*,
       sub.name AS subject_name, sub.code AS subject_code,
       c.name   AS class_name,   sec.name AS section_name,
       t.name   AS term_name,
       (te.first_name || ' ' || te.last_name) AS teacher_name
     FROM assignments a
     JOIN curriculum_subjects cs ON cs.id = a.curriculum_subject_id
     JOIN subjects sub ON sub.id = cs.subject_id
     JOIN classes  c   ON c.id  = a.class_id
     JOIN sections sec ON sec.id = a.section_id
     JOIN terms    t   ON t.id  = a.term_id
     JOIN teachers te  ON te.id = a.teacher_id
     WHERE a.id = $1`,
    [id]
  );
  if (!a.length) return null;

  // Groups with members
  const { rows: groups } = await pool.query(
    `SELECT
       ag.id, ag.name,
       json_agg(json_build_object(
         'student_id', s.id,
         'first_name', s.first_name,
         'last_name',  s.last_name,
         'student_number', s.student_number
       )) AS members
     FROM assignment_groups ag
     LEFT JOIN assignment_group_members m ON m.group_id = ag.id
     LEFT JOIN students s ON s.id = m.student_id
     WHERE ag.assignment_id = $1
     GROUP BY ag.id, ag.name
     ORDER BY ag.name`,
    [id]
  );

  // Submissions
  const { rows: submissions } = await pool.query(
    `SELECT
       sub.*,
       s.first_name, s.last_name, s.student_number,
       ag.name AS group_name
     FROM assignment_submissions sub
     LEFT JOIN students s ON s.id = sub.student_id
     LEFT JOIN assignment_groups ag ON ag.id = sub.group_id
     WHERE sub.assignment_id = $1
     ORDER BY sub.submitted_at DESC`,
    [id]
  );

  return { ...a[0], groups, submissions };
};

const createAssignment = async (teacherId, fields) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO assignments
         (teacher_id, curriculum_subject_id, class_id, section_id, term_id,
          title, description, type, due_date, max_marks, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        teacherId, fields.curriculum_subject_id,
        fields.class_id, fields.section_id, fields.term_id,
        fields.title, fields.description || null,
        fields.type || 'INDIVIDUAL',
        fields.due_date || null, fields.max_marks || null,
        fields.status || 'ACTIVE',
      ]
    );
    const assignment = rows[0];

    // If GROUP type and groups provided, create them
    if (fields.type === 'GROUP' && fields.groups?.length) {
      for (const g of fields.groups) {
        const { rows: grp } = await client.query(
          `INSERT INTO assignment_groups (assignment_id, name) VALUES ($1,$2) RETURNING id`,
          [assignment.id, g.name]
        );
        const groupId = grp[0].id;
        for (const stuId of (g.student_ids || [])) {
          await client.query(
            `INSERT INTO assignment_group_members (group_id, student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
            [groupId, stuId]
          );
        }
      }
    }

    await client.query('COMMIT');
    return getAssignmentById(assignment.id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateAssignment = async (id, fields) => {
  const { rows } = await pool.query(
    `UPDATE assignments
     SET title                  = COALESCE($1, title),
         description            = COALESCE($2, description),
         due_date               = COALESCE($3, due_date),
         max_marks              = COALESCE($4, max_marks),
         status                 = COALESCE($5, status),
         updated_at             = NOW()
     WHERE id = $6 RETURNING *`,
    [fields.title, fields.description, fields.due_date, fields.max_marks, fields.status, id]
  );
  return rows[0] || null;
};

const deleteAssignment = async (id) => {
  await pool.query(`DELETE FROM assignments WHERE id = $1`, [id]);
};

// ─── Group management ─────────────────────────────────────────────────────────

const addGroup = async (assignmentId, { name, student_ids = [] }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO assignment_groups (assignment_id, name) VALUES ($1,$2) RETURNING *`,
      [assignmentId, name]
    );
    const groupId = rows[0].id;
    for (const stuId of student_ids) {
      await client.query(
        `INSERT INTO assignment_group_members (group_id, student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [groupId, stuId]
      );
    }
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateGroup = async (groupId, { name, student_ids }) => {
  if (name) {
    await pool.query(`UPDATE assignment_groups SET name = $1 WHERE id = $2`, [name, groupId]);
  }
  if (student_ids !== undefined) {
    await pool.query(`DELETE FROM assignment_group_members WHERE group_id = $1`, [groupId]);
    for (const stuId of student_ids) {
      await pool.query(
        `INSERT INTO assignment_group_members (group_id, student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [groupId, stuId]
      );
    }
  }
};

const deleteGroup = async (groupId) => {
  await pool.query(`DELETE FROM assignment_groups WHERE id = $1`, [groupId]);
};

// ─── Submissions ──────────────────────────────────────────────────────────────

const submitAssignment = async (assignmentId, studentId, { content, file_url }) => {
  const { rows } = await pool.query(
    `INSERT INTO assignment_submissions (assignment_id, student_id, content, file_url, status)
     VALUES ($1,$2,$3,$4,'SUBMITTED')
     ON CONFLICT (assignment_id, student_id)
     DO UPDATE SET content = EXCLUDED.content, file_url = EXCLUDED.file_url,
                   status = 'SUBMITTED', submitted_at = NOW(), updated_at = NOW()
     RETURNING *`,
    [assignmentId, studentId, content || null, file_url || null]
  );
  return rows[0];
};

const gradeSubmission = async (submissionId, { marks_obtained, teacher_feedback }) => {
  const { rows } = await pool.query(
    `UPDATE assignment_submissions
     SET marks_obtained   = $1,
         teacher_feedback = $2,
         status           = 'GRADED',
         updated_at       = NOW()
     WHERE id = $3 RETURNING *`,
    [marks_obtained, teacher_feedback || null, submissionId]
  );
  return rows[0] || null;
};

// ─── Student view ─────────────────────────────────────────────────────────────

const getStudentAssignments = async (studentId) => {
  // Get student's current enrollment
  const { rows: enr } = await pool.query(
    `SELECT e.class_id, e.section_id, e.academic_year_id,
            t.id AS term_id
     FROM enrollments e
     JOIN academic_years ay ON ay.id = e.academic_year_id
     JOIN terms t ON t.academic_year_id = ay.id AND t.status = 'ACTIVE'
     WHERE e.student_id = $1 AND ay.is_current = TRUE AND e.enrollment_status = 'ACTIVE'
     LIMIT 1`,
    [studentId]
  );
  if (!enr.length) return [];

  const { class_id, section_id, term_id } = enr[0];

  const { rows } = await pool.query(
    `SELECT
       a.id, a.title, a.description, a.type, a.due_date,
       a.max_marks, a.status, a.created_at,
       sub.name AS subject_name,
       (te.first_name || ' ' || te.last_name) AS teacher_name,
       -- Student's own submission
       (SELECT json_build_object(
           'id',               sm.id,
           'status',           sm.status,
           'marks_obtained',   sm.marks_obtained,
           'teacher_feedback', sm.teacher_feedback,
           'submitted_at',     sm.submitted_at
         )
        FROM assignment_submissions sm
        WHERE sm.assignment_id = a.id AND sm.student_id = $4
        LIMIT 1
       ) AS my_submission,
       -- Student's group (if group assignment)
       (SELECT json_build_object('id', ag.id, 'name', ag.name)
        FROM assignment_group_members m
        JOIN assignment_groups ag ON ag.id = m.group_id
        WHERE m.student_id = $4 AND ag.assignment_id = a.id
        LIMIT 1
       ) AS my_group
     FROM assignments a
     JOIN curriculum_subjects cs ON cs.id = a.curriculum_subject_id
     JOIN subjects sub ON sub.id = cs.subject_id
     JOIN teachers te  ON te.id  = a.teacher_id
     WHERE a.class_id = $1 AND a.section_id = $2 AND a.term_id = $3
       AND a.status != 'DRAFT'
     ORDER BY a.due_date ASC NULLS LAST, a.created_at DESC`,
    [class_id, section_id, term_id, studentId]
  );
  return rows;
};

module.exports = {
  listAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  addGroup,
  updateGroup,
  deleteGroup,
  submitAssignment,
  gradeSubmission,
  getStudentAssignments,
};
