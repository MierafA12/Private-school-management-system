const svc = require('../services/principalService');

// ── Dashboard ─────────────────────────────────────────────────────────────────
const getDashboard = async (req, res, next) => {
  try {
    const [stats, enrollmentOverview, attendanceTrend] = await Promise.all([
      svc.getDashboardStats(),
      svc.getEnrollmentOverview(),
      svc.getAttendanceTrend(14),
    ]);
    res.json({ success: true, data: { stats, enrollment_overview: enrollmentOverview, attendance_trend: attendanceTrend } });
  } catch (err) { next(err); }
};

// ── Academic Years ─────────────────────────────────────────────────────────────
const getAcademicYears    = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getAcademicYears() }); }
  catch (err) { next(err); }
};

const getAcademicYearById = async (req, res, next) => {
  try {
    const data = await svc.getAcademicYearById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Academic year not found.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const createAcademicYear  = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await svc.createAcademicYear(req.body) }); }
  catch (err) { next(err); }
};

const updateAcademicYear  = async (req, res, next) => {
  try {
    const data = await svc.updateAcademicYear(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Academic year not found.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// ── Terms ──────────────────────────────────────────────────────────────────────
const createTerm = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await svc.createTerm({ ...req.body, academic_year_id: req.params.yearId }) }); }
  catch (err) { next(err); }
};

const updateTerm = async (req, res, next) => {
  try {
    const data = await svc.updateTerm(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Term not found.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const deleteTerm = async (req, res, next) => {
  try { await svc.deleteTerm(req.params.id); res.json({ success: true, message: 'Term deleted.' }); }
  catch (err) { next(err); }
};

// ── Classes ────────────────────────────────────────────────────────────────────
const getClasses    = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getClasses() }); }
  catch (err) { next(err); }
};

const getClassById  = async (req, res, next) => {
  try {
    const data = await svc.getClassById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Class not found.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const createClass   = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await svc.createClass(req.body) }); }
  catch (err) { next(err); }
};

const updateClass   = async (req, res, next) => {
  try {
    const data = await svc.updateClass(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Class not found.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const deleteClass   = async (req, res, next) => {
  try { await svc.deleteClass(req.params.id); res.json({ success: true, message: 'Class deleted.' }); }
  catch (err) { next(err); }
};

// ── Sections ───────────────────────────────────────────────────────────────────
const createSection = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await svc.createSection({ ...req.body, class_id: req.params.classId }) }); }
  catch (err) { next(err); }
};

const updateSection = async (req, res, next) => {
  try {
    const data = await svc.updateSection(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Section not found.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const deleteSection = async (req, res, next) => {
  try { await svc.deleteSection(req.params.id); res.json({ success: true, message: 'Section deleted.' }); }
  catch (err) { next(err); }
};

// ── Subjects ───────────────────────────────────────────────────────────────────
const getSubjects    = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getSubjects() }); }
  catch (err) { next(err); }
};

const createSubject  = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await svc.createSubject(req.body) }); }
  catch (err) { next(err); }
};

const updateSubject  = async (req, res, next) => {
  try {
    const data = await svc.updateSubject(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Subject not found.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const deleteSubject  = async (req, res, next) => {
  try { await svc.deleteSubject(req.params.id); res.json({ success: true, message: 'Subject deleted.' }); }
  catch (err) { next(err); }
};

// ── Curriculum ─────────────────────────────────────────────────────────────────
const getCurriculum    = async (req, res, next) => {
  try {
    const data = await svc.getCurriculumForClass(req.query.academic_year_id, req.query.class_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const assignSubject    = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await svc.assignSubjectToClass(req.body) }); }
  catch (err) { next(err); }
};

const removeSubject    = async (req, res, next) => {
  try { await svc.removeSubjectFromClass(req.params.id); res.json({ success: true, message: 'Subject removed from curriculum.' }); }
  catch (err) { next(err); }
};

module.exports = {
  getDashboard,
  getAcademicYears, getAcademicYearById, createAcademicYear, updateAcademicYear,
  createTerm, updateTerm, deleteTerm,
  getClasses, getClassById, createClass, updateClass, deleteClass,
  createSection, updateSection, deleteSection,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getCurriculum, assignSubject, removeSubject,
};
