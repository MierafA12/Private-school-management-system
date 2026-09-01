const svc = require('../services/enrollmentService');

// GET /api/registrar/enrollments
const listEnrollments = async (req, res, next) => {
  try {
    const { academic_year_id, class_id, section_id, search, status, limit, offset } = req.query;
    const data = await svc.listEnrollments({
      academic_year_id: academic_year_id || null,
      class_id:         class_id         || null,
      section_id:       section_id       || null,
      search:           search           || null,
      status:           status           || null,
      limit:  Math.min(parseInt(limit)  || 50, 200),
      offset: parseInt(offset) || 0,
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/registrar/enrollments/:id
const getEnrollment = async (req, res, next) => {
  try {
    const data = await svc.getEnrollmentById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Enrollment not found.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// POST /api/registrar/enrollments
const createEnrollment = async (req, res, next) => {
  try {
    const data = await svc.createEnrollment(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

// PATCH /api/registrar/enrollments/:id
const updateEnrollment = async (req, res, next) => {
  try {
    const data = await svc.updateEnrollment(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Enrollment not found.' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// POST /api/registrar/enrollments/promote
const promoteStudents = async (req, res, next) => {
  try {
    const { academic_year_id, enrollment_date, promotions } = req.body;
    if (!promotions?.length) {
      return res.status(422).json({ success: false, message: 'promotions array is required.' });
    }
    const data = await svc.promoteStudents({ academic_year_id, enrollment_date, promotions });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/registrar/enrollments/unenrolled?academic_year_id=&search=
const getUnenrolled = async (req, res, next) => {
  try {
    const { academic_year_id, search } = req.query;
    if (!academic_year_id) {
      return res.status(422).json({ success: false, message: 'academic_year_id is required.' });
    }
    const data = await svc.getUnenrolledStudents(academic_year_id, search || null);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/registrar/enrollments/options
const getOptions = async (req, res, next) => {
  try {
    const data = await svc.getEnrollmentOptions();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = {
  listEnrollments,
  getEnrollment,
  createEnrollment,
  updateEnrollment,
  promoteStudents,
  getUnenrolled,
  getOptions,
};
