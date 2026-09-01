const router = require('express').Router();
const { query } = require('express-validator');
const svc      = require('../services/teacherService');
const examSvc  = require('../services/examService');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);
router.use(authorize('Teacher', 'Super Admin', 'Principal'));

// ─── Helper: get teacher record from JWT user ────────────────────────────────
const resolveTeacher = async (userId) => {
  const teacher = await svc.getTeacherByUserId(userId);
  if (!teacher) {
    const err = new Error('Teacher profile not found for this user.'); err.status = 404; throw err;
  }
  return teacher;
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res, next) => {
  try {
    const teacher = await resolveTeacher(req.user.id);
    res.json({ success: true, data: await svc.getDashboard(teacher.id) });
  } catch (err) { next(err); }
});

// ── Assigned classes ──────────────────────────────────────────────────────────
router.get('/classes', async (req, res, next) => {
  try {
    const teacher = await resolveTeacher(req.user.id);
    res.json({ success: true, data: await svc.getAssignedClasses(teacher.id) });
  } catch (err) { next(err); }
});

// ── Weekly timetable ──────────────────────────────────────────────────────────
router.get('/timetable', async (req, res, next) => {
  try {
    const teacher = await resolveTeacher(req.user.id);
    res.json({ success: true, data: await svc.getWeeklyTimetable(teacher.id) });
  } catch (err) { next(err); }
});

// ── Attendance ────────────────────────────────────────────────────────────────
router.get('/attendance', async (req, res, next) => {
  try {
    const { classId, sectionId, date } = req.query;
    if (!classId || !sectionId || !date) {
      return res.status(422).json({ success: false, message: 'classId, sectionId, date are required.' });
    }
    res.json({ success: true, data: { records: await svc.getAttendanceSheet(classId, sectionId, date) } });
  } catch (err) { next(err); }
});

router.post('/attendance', async (req, res, next) => {
  try {
    const teacher = await resolveTeacher(req.user.id);
    const result  = await svc.submitAttendance(teacher.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ── Students in a section ─────────────────────────────────────────────────────
router.get('/students', async (req, res, next) => {
  try {
    const { classId, sectionId } = req.query;
    if (!classId || !sectionId) return res.status(422).json({ success: false, message: 'classId and sectionId required.' });
    res.json({ success: true, data: await svc.getSectionStudents(classId, sectionId) });
  } catch (err) { next(err); }
});

// ── Exams — teacher sees their assigned subjects only ─────────────────────────
router.get('/exams', async (req, res, next) => {
  try {
    const teacher = await resolveTeacher(req.user.id);
    const { classId, sectionId, subjectId } = req.query;
    const data = await examSvc.getExamSchedules({
      class_id:   classId   || null,
      section_id: sectionId || null,
      teacher_id: teacher.id,
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ── Announcements ─────────────────────────────────────────────────────────────
router.get('/announcements', async (req, res, next) => {
  try {
    const pool = require('../db');
    const { rows } = await pool.query(
      `SELECT a.id, a.title, a.body, a.audience, a.priority, a.publish_at
       FROM announcements a
       WHERE a.is_published = TRUE
         AND a.publish_at <= NOW()
         AND (a.expires_at IS NULL OR a.expires_at > NOW())
         AND a.audience IN ('ALL','TEACHERS')
       ORDER BY a.publish_at DESC
       LIMIT 50`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

module.exports = router;
