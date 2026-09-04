const router = require('express').Router();
const ctrl = require('../controllers/teacherController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('Teacher', 'Super Admin', 'Principal'));

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', ctrl.getDashboard);

// ── Assigned classes ──────────────────────────────────────────────────────────
router.get('/classes', ctrl.getClasses);

// ── Weekly timetable ──────────────────────────────────────────────────────────
router.get('/timetable', ctrl.getTimetable);

// ── Attendance ────────────────────────────────────────────────────────────────
router.get('/attendance', ctrl.getAttendance);
router.post('/attendance', ctrl.submitAttendance);

// ── Students in a section ─────────────────────────────────────────────────────
router.get('/students', ctrl.getSectionStudents);

// ── Exams assigned to teacher ─────────────────────────────────────────────────
router.get('/exams', ctrl.getExams);

// ── Announcements ─────────────────────────────────────────────────────────────
router.get('/announcements', ctrl.getAnnouncements);

module.exports = router;
