const teacherService = require('../services/teacherService');
const examService = require('../services/examService');
const pool = require('../db');

// Helper to resolve teacher record from authenticated JWT user
const resolveTeacher = async (userId) => {
  const teacher = await teacherService.getTeacherByUserId(userId);
  if (!teacher) {
    const err = new Error('Teacher profile not found for this user.');
    err.status = 404;
    throw err;
  }
  return teacher;
};

exports.getDashboard = async (req, res, next) => {
  try {
    const teacher = await resolveTeacher(req.user.id);
    const data = await teacherService.getDashboard(teacher.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getClasses = async (req, res, next) => {
  try {
    const teacher = await resolveTeacher(req.user.id);
    const data = await teacherService.getAssignedClasses(teacher.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getTimetable = async (req, res, next) => {
  try {
    const teacher = await resolveTeacher(req.user.id);
    const data = await teacherService.getWeeklyTimetable(teacher.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getAttendance = async (req, res, next) => {
  try {
    const { classId, sectionId, date } = req.query;
    if (!classId || !sectionId || !date) {
      return res.status(422).json({
        success: false,
        message: 'classId, sectionId, and date are required query parameters.',
      });
    }
    const records = await teacherService.getAttendanceSheet(classId, sectionId, date);
    res.json({ success: true, data: { records } });
  } catch (err) {
    next(err);
  }
};

exports.submitAttendance = async (req, res, next) => {
  try {
    const teacher = await resolveTeacher(req.user.id);
    const result = await teacherService.submitAttendance(teacher.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.getSectionStudents = async (req, res, next) => {
  try {
    const { classId, sectionId } = req.query;
    if (!classId || !sectionId) {
      return res.status(422).json({
        success: false,
        message: 'classId and sectionId are required query parameters.',
      });
    }
    const students = await teacherService.getSectionStudents(classId, sectionId);
    res.json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
};

exports.getExams = async (req, res, next) => {
  try {
    const teacher = await resolveTeacher(req.user.id);
    const { classId, sectionId, subjectId } = req.query;
    const data = await examService.getExamSchedules({
      class_id: classId || null,
      section_id: sectionId || null,
      curriculum_subject_id: subjectId || null,
      teacher_id: teacher.id,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getAnnouncements = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const { rows } = await pool.query(
      `SELECT a.id, a.title, a.body, a.audience, a.priority, a.publish_at
       FROM announcements a
       WHERE a.is_published = TRUE
         AND a.publish_at <= NOW()
         AND (a.expires_at IS NULL OR a.expires_at > NOW())
         AND a.audience IN ('ALL','TEACHERS')
       ORDER BY a.publish_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};
