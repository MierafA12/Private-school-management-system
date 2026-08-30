const router = require('express').Router();
const ctrl = require('../controllers/teacherController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes here require Teacher role
router.use(authenticate);
router.use(authorize('Teacher'));

router.get('/dashboard', ctrl.getDashboard);
router.get('/classes', ctrl.getClasses);
router.get('/timetable', ctrl.getTimetable);

router.get('/attendance', ctrl.getAttendance);
router.post('/attendance', ctrl.submitAttendance);

router.get('/exams', ctrl.getExamsAndGrades);
router.get('/exams/:examScheduleId/results', ctrl.getExamResults);
router.post('/exams/:examScheduleId/results', ctrl.submitGrades);

router.get('/announcements', ctrl.getAnnouncements);

module.exports = router;
