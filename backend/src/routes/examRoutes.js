const router = require('express').Router();
const { body, query } = require('express-validator');
const svc      = require('../services/examService');
const pool     = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

// ─────────────────────────────────────────────────────────────────────────────
// EXAM SCHEDULES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/exams/schedules — filtered list
router.get('/schedules', async (req, res, next) => {
  try {
    // teacher only sees their assigned subjects
    const isTeacher = req.user.role_name === 'Teacher';
    let teacherId = null;
    if (isTeacher) {
      const { rows } = await pool.query(`SELECT id FROM teachers WHERE user_id = $1`, [req.user.id]);
      teacherId = rows[0]?.id || null;
    }
    const data = await svc.getExamSchedules({
      term_id:    req.query.term_id    || null,
      class_id:   req.query.class_id   || null,
      section_id: req.query.section_id || null,
      teacher_id: teacherId,
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// POST /api/exams/schedules — principal / teacher creates
router.post('/schedules',
  authorize('Principal', 'Super Admin', 'Teacher'),
  [
    body('term_id').isUUID(),
    body('academic_year_id').isUUID(),
    body('class_id').isUUID(),
    body('section_id').isUUID(),
    body('curriculum_subject_id').isUUID(),
    body('title').notEmpty(),
    body('exam_date').isDate(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const data = await svc.createExamSchedule(req.user.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }
);

router.patch('/schedules/:id', authorize('Principal', 'Super Admin', 'Teacher'), async (req, res, next) => {
  try {
    const data = await svc.updateExamSchedule(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Exam schedule not found.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.delete('/schedules/:id', authorize('Principal', 'Super Admin'), async (req, res, next) => {
  try { await svc.deleteExamSchedule(req.params.id); res.json({ success: true }); }
  catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// MARK COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

router.get('/schedules/:id/components', async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getMarkComponents(req.params.id) }); }
  catch (err) { next(err); }
});

router.put('/schedules/:id/components',
  authorize('Principal', 'Super Admin', 'Teacher'),
  [body('components').isArray({ min: 1 }).withMessage('components array required.')],
  validate,
  async (req, res, next) => {
    try {
      const data = await svc.upsertMarkComponents(req.params.id, req.body.components);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// MARK SHEET  (teacher enters/views marks)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/exams/schedules/:id/marksheet?section_id=
router.get('/schedules/:id/marksheet',
  authorize('Principal', 'Super Admin', 'Teacher'),
  async (req, res, next) => {
    try {
      const { section_id } = req.query;
      if (!section_id) return res.status(422).json({ success: false, message: 'section_id required.' });
      const data = await svc.getExamMarkSheet(req.params.id, section_id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
);

// POST /api/exams/schedules/:id/marks/:studentId — save one student's marks
router.post('/schedules/:id/marks/:studentId',
  authorize('Principal', 'Super Admin', 'Teacher'),
  [body('marks').isArray({ min: 1 })],
  validate,
  async (req, res, next) => {
    try {
      await svc.saveStudentMarks(req.user.id, req.params.studentId, req.body.marks);
      res.json({ success: true, message: 'Marks saved.' });
    } catch (err) { next(err); }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// REPORT CARDS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/exams/report-cards?term_id=&section_id=
router.get('/report-cards',
  authorize('Principal', 'Super Admin', 'Teacher'),
  async (req, res, next) => {
    try {
      const data = await svc.listReportCards({
        term_id:      req.query.term_id      || null,
        section_id:   req.query.section_id   || null,
        is_published: req.query.is_published !== undefined
          ? req.query.is_published === 'true' : undefined,
      });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
);

// GET /api/exams/report-cards/:id
router.get('/report-cards/:id', async (req, res, next) => {
  try {
    const data = await svc.getReportCard(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Report card not found.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// POST /api/exams/report-cards/generate — generate for one student
router.post('/report-cards/generate',
  authorize('Principal', 'Super Admin', 'Teacher'),
  [body('student_id').isUUID(), body('term_id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const data = await svc.generateReportCard(req.user.id, req.body.student_id, req.body.term_id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
);

// POST /api/exams/report-cards/generate-section — generate for entire section
router.post('/report-cards/generate-section',
  authorize('Principal', 'Super Admin'),
  [body('term_id').isUUID(), body('section_id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const data = await svc.generateReportCardsForSection(
        req.user.id, req.body.term_id, req.body.section_id
      );
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
);

// PATCH /api/exams/report-cards/:id/publish
router.patch('/report-cards/:id/publish',
  authorize('Principal', 'Super Admin'),
  [body('is_published').isBoolean()],
  validate,
  async (req, res, next) => {
    try {
      const data = await svc.setReportCardPublished(req.params.id, req.body.is_published);
      if (!data) return res.status(404).json({ success: false, message: 'Report card not found.' });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
);

// PATCH /api/exams/report-cards/:id/remarks/:subjectId
router.patch('/report-cards/:id/remarks/:subjectId',
  authorize('Principal', 'Super Admin', 'Teacher'),
  [body('remarks').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const data = await svc.addTeacherRemarks(
        req.user.id, req.params.id, req.params.subjectId, req.body.remarks
      );
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
);

module.exports = router;
