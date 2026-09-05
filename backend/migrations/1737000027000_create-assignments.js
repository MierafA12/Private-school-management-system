/**
 * Migration: Assignments system
 * Tables:
 *   assignments        — the assignment itself (individual or group)
 *   assignment_groups  — groups of students for a group assignment
 *   assignment_group_members — students inside each group
 *   assignment_submissions   — each student's / group's submission
 */

exports.up = (pgm) => {

  // ── assignments ──────────────────────────────────────────────────────────
  pgm.createTable('assignments', {
    id: { type: 'UUID', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    teacher_id:            { type: 'UUID', notNull: true,  references: '"teachers"',             onDelete: 'CASCADE' },
    curriculum_subject_id: { type: 'UUID', notNull: true,  references: '"curriculum_subjects"',  onDelete: 'CASCADE' },
    class_id:              { type: 'UUID', notNull: true,  references: '"classes"',              onDelete: 'CASCADE' },
    section_id:            { type: 'UUID', notNull: true,  references: '"sections"',             onDelete: 'CASCADE' },
    term_id:               { type: 'UUID', notNull: true,  references: '"terms"',                onDelete: 'CASCADE' },
    title:       { type: 'VARCHAR(255)', notNull: true  },
    description: { type: 'TEXT',         notNull: false },
    type:        { type: 'VARCHAR(20)',  notNull: true, default: "'INDIVIDUAL'" }, // INDIVIDUAL | GROUP
    due_date:    { type: 'TIMESTAMP',    notNull: false },
    max_marks:   { type: 'NUMERIC(6,2)', notNull: false },
    status:      { type: 'VARCHAR(20)',  notNull: true, default: "'ACTIVE'" },     // ACTIVE | CLOSED | DRAFT
    created_at:  { type: 'TIMESTAMP', default: pgm.func('NOW()'), notNull: true },
    updated_at:  { type: 'TIMESTAMP', default: pgm.func('NOW()'), notNull: true },
  });
  pgm.addConstraint('assignments', 'chk_assignments_type',   "CHECK (type   IN ('INDIVIDUAL','GROUP'))");
  pgm.addConstraint('assignments', 'chk_assignments_status', "CHECK (status IN ('DRAFT','ACTIVE','CLOSED'))");
  pgm.createIndex('assignments', 'teacher_id');
  pgm.createIndex('assignments', ['class_id', 'section_id']);
  pgm.createIndex('assignments', 'term_id');

  // ── assignment_groups ─────────────────────────────────────────────────────
  pgm.createTable('assignment_groups', {
    id:            { type: 'UUID', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    assignment_id: { type: 'UUID', notNull: true, references: '"assignments"', onDelete: 'CASCADE' },
    name:          { type: 'VARCHAR(100)', notNull: true },
    created_at:    { type: 'TIMESTAMP', default: pgm.func('NOW()'), notNull: true },
  });
  pgm.createIndex('assignment_groups', 'assignment_id');

  // ── assignment_group_members ──────────────────────────────────────────────
  pgm.createTable('assignment_group_members', {
    id:         { type: 'UUID', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    group_id:   { type: 'UUID', notNull: true, references: '"assignment_groups"', onDelete: 'CASCADE' },
    student_id: { type: 'UUID', notNull: true, references: '"students"',          onDelete: 'CASCADE' },
  });
  pgm.addConstraint('assignment_group_members', 'uq_group_member', 'UNIQUE (group_id, student_id)');
  pgm.createIndex('assignment_group_members', 'group_id');
  pgm.createIndex('assignment_group_members', 'student_id');

  // ── assignment_submissions ────────────────────────────────────────────────
  pgm.createTable('assignment_submissions', {
    id:            { type: 'UUID', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    assignment_id: { type: 'UUID', notNull: true, references: '"assignments"',       onDelete: 'CASCADE' },
    student_id:    { type: 'UUID', notNull: false, references: '"students"',          onDelete: 'CASCADE' },
    group_id:      { type: 'UUID', notNull: false, references: '"assignment_groups"', onDelete: 'CASCADE' },
    content:       { type: 'TEXT',         notNull: false },
    file_url:      { type: 'TEXT',         notNull: false },
    marks_obtained:{ type: 'NUMERIC(6,2)', notNull: false },
    teacher_feedback: { type: 'TEXT',      notNull: false },
    status:        { type: 'VARCHAR(20)',  notNull: true, default: "'SUBMITTED'" },
    submitted_at:  { type: 'TIMESTAMP', default: pgm.func('NOW()'), notNull: true },
    updated_at:    { type: 'TIMESTAMP', default: pgm.func('NOW()'), notNull: true },
  });
  pgm.addConstraint('assignment_submissions', 'chk_submission_owner',
    'CHECK ((student_id IS NOT NULL AND group_id IS NULL) OR (student_id IS NULL AND group_id IS NOT NULL))');
  pgm.addConstraint('assignment_submissions', 'uq_submission_student',
    'UNIQUE (assignment_id, student_id)');
  pgm.createIndex('assignment_submissions', 'assignment_id');
  pgm.createIndex('assignment_submissions', 'student_id');
};

exports.down = (pgm) => {
  pgm.dropTable('assignment_submissions');
  pgm.dropTable('assignment_group_members');
  pgm.dropTable('assignment_groups');
  pgm.dropTable('assignments');
};
