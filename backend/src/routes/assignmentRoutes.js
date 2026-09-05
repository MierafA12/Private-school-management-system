const router = require('express').Router();
const { body } = require('express-validator');
const svc    = require('../services/assignmentService');
const tSvc   = require('../services/teacherService');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

// ─── Helper ───────────────────────────────────────────────────────────────────
const resolveTeacher = async (userId) => {
  const t = await tSvc.getTeacherByUserId(userId);
  if (!t) { const e = new Error('Teacher profile not found.'); e.status = 404; throw e; }
  return t;
};

// ═════════════════════════════════════════════════════════════════════════════
// TEACHER ROUTES
// ═════════════════════════════════════════════════════════════════════════════
const TEACHER_ROLES = ['Teacher', 'Principal', 'Super Admin'];

// List assignments (teacher sees their own)
router.get('/', authorize(...TEACHER_ROLES), async (req, res, next) => {
  try {
    const teacher = await resolveTeacher(req.user.id);
    const data = await svc.listAssignments({
      teacherId: teacher.id,
      classId:   req.query.class_id   || null,
      sectionId: req.query.section_id || null,
      termId:    req.query.term_id    || null,
      status:    req.query.status     || null,
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Get one assignment detail
router.get('/:id', async (req, res, next) => {
  try {
    const data = await svc.getAssignmentById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Assignment not found.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Create assignment
router.post('/', authorize(...TEACHER_ROLES),
  [
    body('curriculum_subject_id').isUUID(),
    body('class_id').isUUID(),
    body('section_id').isUUID(),
    body('term_id').isUUID(),
    body('title').notEmpty().withMessage('title is required.'),
    body('type').optional().isIn(['INDIVIDUAL', 'GROUP']),
    body('status').optional().isIn(['DRAFT', 'ACTIVE', 'CLOSED']),
    body('max_marks').optional().isFloat({ min: 0 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const teacher = await resolveTeacher(req.user.id);
      const data    = await svc.createAssignment(teacher.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }
);

// Update assignment
router.patch('/:id', authorize(...TEACHER_ROLES), async (req, res, next) => {
  try {
    const data = await svc.updateAssignment(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Assignment not found.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Delete assignment
router.delete('/:id', authorize(...TEACHER_ROLES), async (req, res, next) => {
  try { await svc.deleteAssignment(req.params.id); res.json({ success: true }); }
  catch (err) { next(err); }
});

// ─── Groups ───────────────────────────────────────────────────────────────────

router.post('/:id/groups', authorize(...TEACHER_ROLES),
  [body('name').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const data = await svc.addGroup(req.params.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }
);

router.patch('/groups/:groupId', authorize(...TEACHER_ROLES), async (req, res, next) => {
  try { await svc.updateGroup(req.params.groupId, req.body); res.json({ success: true }); }
  catch (err) { next(err); }
});

router.delete('/groups/:groupId', authorize(...TEACHER_ROLES), async (req, res, next) => {
  try { await svc.deleteGroup(req.params.groupId); res.json({ success: true }); }
  catch (err) { next(err); }
});

// ─── Grade a submission ───────────────────────────────────────────────────────

router.patch('/submissions/:subId/grade', authorize(...TEACHER_ROLES),
  [body('marks_obtained').optional().isFloat({ min: 0 })],
  validate,
  async (req, res, next) => {
    try {
      const data = await svc.gradeSubmission(req.params.subId, req.body);
      if (!data) return res.status(404).json({ success: false, message: 'Submission not found.' });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// STUDENT ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// Student list their assignments
router.get('/student/my', authorize('Student'), async (req, res, next) => {
  try {
    const pool = require('../db');
    const { rows } = await pool.query(
      `SELECT id FROM students WHERE user_id = $1`, [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, data: await svc.getStudentAssignments(rows[0].id) });
  } catch (err) { next(err); }
});

// Student submit
router.post('/:id/submit', authorize('Student'),
  [body('content').optional().isString()],
  validate,
  async (req, res, next) => {
    try {
      const pool = require('../db');
      const { rows } = await pool.query(`SELECT id FROM students WHERE user_id = $1`, [req.user.id]);
      if (!rows.length) return res.status(404).json({ success: false, message: 'Student not found.' });
      const data = await svc.submitAssignment(req.params.id, rows[0].id, req.body);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
);

module.exports = router;
