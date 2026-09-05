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

// ── School Profile ────────────────────────────────────────────────────────────
const getSchoolProfile = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getSchoolProfile() }); }
  catch (err) { next(err); }
};

const updateSchoolProfile = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.updateSchoolProfile(req.body) }); }
  catch (err) { next(err); }
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
const deleteAcademicYear  = async (req, res, next) => {
  try {
    await svc.deleteAcademicYear(req.params.id);
    res.json({ success: true, message: 'Academic year deleted successfully.' });
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
const getClasses   = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getClasses() }); }
  catch (err) { next(err); }
};
const getClassById = async (req, res, next) => {
  try {
    const data = await svc.getClassById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Class not found.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
const createClass  = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await svc.createClass(req.body) }); }
  catch (err) { next(err); }
};
const updateClass  = async (req, res, next) => {
  try {
    const data = await svc.updateClass(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Class not found.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
const deleteClass  = async (req, res, next) => {
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
const getSubjects   = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getSubjects() }); }
  catch (err) { next(err); }
};
const createSubject = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await svc.createSubject(req.body) }); }
  catch (err) { next(err); }
};
const updateSubject = async (req, res, next) => {
  try {
    const data = await svc.updateSubject(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Subject not found.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
const deleteSubject = async (req, res, next) => {
  try { await svc.deleteSubject(req.params.id); res.json({ success: true, message: 'Subject deleted.' }); }
  catch (err) { next(err); }
};

// ── Curriculum ─────────────────────────────────────────────────────────────────
const getCurriculum = async (req, res, next) => {
  try {
    res.json({ success: true, data: await svc.getCurriculumForClass(req.query.academic_year_id, req.query.class_id) });
  } catch (err) { next(err); }
};
const assignSubject = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await svc.assignSubjectToClass(req.body) }); }
  catch (err) { next(err); }
};
const removeSubject = async (req, res, next) => {
  try { await svc.removeSubjectFromClass(req.params.id); res.json({ success: true, message: 'Subject removed from curriculum.' }); }
  catch (err) { next(err); }
};

// ── Grading Scales ────────────────────────────────────────────────────────────
const getGradingScales   = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getGradingScales() }); }
  catch (err) { next(err); }
};
const createGradingScale = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await svc.createGradingScale(req.body) }); }
  catch (err) { next(err); }
};
const updateGradingScale = async (req, res, next) => {
  try {
    const data = await svc.updateGradingScale(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Grade not found.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
const deleteGradingScale = async (req, res, next) => {
  try { await svc.deleteGradingScale(req.params.id); res.json({ success: true, message: 'Grade deleted.' }); }
  catch (err) { next(err); }
};

// ── Class Advisors ────────────────────────────────────────────────────────────
const getClassAdvisors  = async (req, res, next) => {
  try {
    const { academic_year_id } = req.query;
    if (!academic_year_id) return res.status(422).json({ success: false, message: 'academic_year_id required.' });
    res.json({ success: true, data: await svc.getClassAdvisors(academic_year_id) });
  } catch (err) { next(err); }
};
const assignClassAdvisor = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await svc.assignClassAdvisor(req.body) }); }
  catch (err) { next(err); }
};
const removeClassAdvisor = async (req, res, next) => {
  try { await svc.removeClassAdvisor(req.params.id); res.json({ success: true, message: 'Advisor removed.' }); }
  catch (err) { next(err); }
};

// ── Timetable ─────────────────────────────────────────────────────────────────
const getTimetable = async (req, res, next) => {
  try {
    res.json({ success: true, data: await svc.getTimetable(req.query) });
  } catch (err) { next(err); }
};
const createTimetableSlot = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await svc.createTimetableSlot(req.body) }); }
  catch (err) { next(err); }
};
const updateTimetableSlot = async (req, res, next) => {
  try {
    const data = await svc.updateTimetableSlot(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Timetable slot not found.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
const deleteTimetableSlot = async (req, res, next) => {
  try { await svc.deleteTimetableSlot(req.params.id); res.json({ success: true, message: 'Slot deleted.' }); }
  catch (err) { next(err); }
};
const clearTimetable = async (req, res, next) => {
  try {
    await svc.clearTimetable(req.body);
    res.json({ success: true, message: 'Timetable cleared.' });
  } catch (err) { next(err); }
};

// ── Teachers List (for dropdowns) ────────────────────────────────────────────
const getTeacherList = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getTeacherList() }); }
  catch (err) { next(err); }
};

// ── Fee Structures ────────────────────────────────────────────────────────────
const getFeeStructures   = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getFeeStructures(req.query.academic_year_id || null) }); }
  catch (err) { next(err); }
};
const createFeeStructure = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await svc.createFeeStructure(req.body) }); }
  catch (err) { next(err); }
};
const updateFeeStructure = async (req, res, next) => {
  try {
    const data = await svc.updateFeeStructure(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Fee structure not found.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
const deleteFeeStructure = async (req, res, next) => {
  try { await svc.deleteFeeStructure(req.params.id); res.json({ success: true, message: 'Fee structure deleted.' }); }
  catch (err) { next(err); }
};

// ── Announcements ─────────────────────────────────────────────────────────────
const getAnnouncements = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getAnnouncements(req.query) }); }
  catch (err) { next(err); }
};
const createAnnouncement = async (req, res, next) => {
  try {
    const data = await svc.createAnnouncement(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};
const deleteAnnouncement = async (req, res, next) => {
  try { await svc.deleteAnnouncement(req.params.id); res.json({ success: true, message: 'Deleted.' }); }
  catch (err) { next(err); }
};

module.exports = {
  getDashboard,
  getSchoolProfile, updateSchoolProfile,
  getAcademicYears, getAcademicYearById, createAcademicYear, updateAcademicYear, deleteAcademicYear,
  createTerm, updateTerm, deleteTerm,
  getClasses, getClassById, createClass, updateClass, deleteClass,
  createSection, updateSection, deleteSection,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getCurriculum, assignSubject, removeSubject,
  getGradingScales, createGradingScale, updateGradingScale, deleteGradingScale,
  getClassAdvisors, assignClassAdvisor, removeClassAdvisor,
  getTimetable, createTimetableSlot, updateTimetableSlot, deleteTimetableSlot, clearTimetable,
  getTeacherList,
  getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure,
  getAnnouncements, createAnnouncement, deleteAnnouncement,
};

