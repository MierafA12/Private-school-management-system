const examService = require('../services/examService');

const getSchedules = async (req, res, next) => {
  try {
    const schedules = await examService.getExamSchedules(req.query);
    res.json({ success: true, data: schedules });
  } catch (err) {
    next(err);
  }
};

const getScheduleById = async (req, res, next) => {
  try {
    const schedule = await examService.getExamScheduleById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Exam schedule not found.' });
    }
    res.json({ success: true, data: schedule });
  } catch (err) {
    next(err);
  }
};

const createSchedule = async (req, res, next) => {
  try {
    const schedule = await examService.createExamSchedule(req.body, req.user.id);
    res.status(201).json({ success: true, data: schedule });
  } catch (err) {
    next(err);
  }
};

const updateSchedule = async (req, res, next) => {
  try {
    const schedule = await examService.updateExamSchedule(req.params.id, req.body);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Exam schedule not found.' });
    }
    res.json({ success: true, data: schedule });
  } catch (err) {
    next(err);
  }
};

const deleteSchedule = async (req, res, next) => {
  try {
    await examService.deleteExamSchedule(req.params.id);
    res.json({ success: true, message: 'Exam schedule deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

const getComponents = async (req, res, next) => {
  try {
    const components = await examService.getComponents(req.params.examId);
    res.json({ success: true, data: components });
  } catch (err) {
    next(err);
  }
};

const saveComponents = async (req, res, next) => {
  try {
    const components = req.body.components || req.body;
    const saved = await examService.saveComponents(req.params.examId, Array.isArray(components) ? components : []);
    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
};

const getMarkSheet = async (req, res, next) => {
  try {
    const markSheet = await examService.getMarkSheet(req.params.examId, req.query.section_id);
    res.json({ success: true, data: markSheet });
  } catch (err) {
    next(err);
  }
};

const saveMarks = async (req, res, next) => {
  try {
    const result = await examService.saveMarks(
      req.params.examId,
      req.params.studentId,
      req.body.marks || req.body,
      req.user?.id
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const listReportCards = async (req, res, next) => {
  try {
    const cards = await examService.listReportCards(req.query);
    res.json({ success: true, data: cards });
  } catch (err) {
    next(err);
  }
};

const getReportCard = async (req, res, next) => {
  try {
    const card = await examService.getReportCard(req.params.id);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Report card not found.' });
    }
    res.json({ success: true, data: card });
  } catch (err) {
    next(err);
  }
};

const generateReportCard = async (req, res, next) => {
  try {
    const card = await examService.generateReportCard(req.body);
    res.json({ success: true, data: card });
  } catch (err) {
    next(err);
  }
};

const generateSectionCards = async (req, res, next) => {
  try {
    const result = await examService.generateSectionCards(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const publishReportCard = async (req, res, next) => {
  try {
    const card = await examService.publishReportCard(req.params.id, req.body.is_published);
    if (!card) return res.status(404).json({ success: false, message: 'Report card not found.' });
    res.json({ success: true, data: card });
  } catch (err) {
    next(err);
  }
};

const addRemarks = async (req, res, next) => {
  try {
    const card = await examService.addRemarks(req.params.id, req.params.subId, req.body.remarks);
    if (!card) return res.status(404).json({ success: false, message: 'Report card or item not found.' });
    res.json({ success: true, data: card });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getComponents,
  saveComponents,
  getMarkSheet,
  saveMarks,
  listReportCards,
  getReportCard,
  generateReportCard,
  generateSectionCards,
  publishReportCard,
  addRemarks,
};
