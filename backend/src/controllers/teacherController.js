const teacherService = require('../services/teacherService');

exports.getDashboard = async (req, res, next) => {
  try {
    const stats = await teacherService.getDashboardStats(req.user.id);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

exports.getClasses = async (req, res, next) => {
  try {
    const classes = await teacherService.getClasses(req.user.id);
    res.json({ success: true, data: classes });
  } catch (err) {
    next(err);
  }
};

exports.getTimetable = async (req, res, next) => {
  try {
    const timetable = await teacherService.getTimetable(req.user.id);
    res.json({ success: true, data: timetable });
  } catch (err) {
    next(err);
  }
};

exports.getAttendance = async (req, res, next) => {
  try {
    const { classId, sectionId, date } = req.query;
    if (!classId || !sectionId || !date) {
      return res.status(400).json({ success: false, message: 'Missing required query parameters: classId, sectionId, date' });
    }
    const attendance = await teacherService.getAttendance(req.user.id, classId, sectionId, date);
    res.json({ success: true, data: attendance });
  } catch (err) {
    next(err);
  }
};

exports.submitAttendance = async (req, res, next) => {
  try {
    const { classId, sectionId, date, records } = req.body;
    if (!classId || !sectionId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Invalid payload.' });
    }
    const result = await teacherService.submitAttendance(req.user.id, classId, sectionId, date, records);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getExamsAndGrades = async (req, res, next) => {
  try {
    const { classId, sectionId, subjectId } = req.query;
    if (!classId || !sectionId || !subjectId) {
      return res.status(400).json({ success: false, message: 'Missing required query parameters: classId, sectionId, subjectId' });
    }
    const data = await teacherService.getExamsAndGrades(req.user.id, classId, sectionId, subjectId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getExamResults = async (req, res, next) => {
  try {
    const { examScheduleId } = req.params;
    const data = await teacherService.getExamResults(examScheduleId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.submitGrades = async (req, res, next) => {
  try {
    const { examScheduleId } = req.params;
    const { results } = req.body;
    if (!results || !Array.isArray(results)) {
      return res.status(400).json({ success: false, message: 'Invalid payload.' });
    }
    const result = await teacherService.submitGrades(req.user.id, examScheduleId, results);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getAnnouncements = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const announcements = await teacherService.getAnnouncements({ limit, offset });
    res.json({ success: true, data: announcements });
  } catch (err) {
    next(err);
  }
};
