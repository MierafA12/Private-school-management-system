const svc = require('../services/registrarService');

// ─── POST /api/registrar/students ────────────────────────────────────────────
const createStudent = async (req, res, next) => {
  try {
    const result = await svc.registerStudent(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

// ─── POST /api/registrar/parents ─────────────────────────────────────────────
const createParent = async (req, res, next) => {
  try {
    const result = await svc.registerParent(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

// ─── POST /api/registrar/teachers ────────────────────────────────────────────
const createTeacher = async (req, res, next) => {
  try {
    const result = await svc.registerTeacher(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

// ─── POST /api/registrar/staff ───────────────────────────────────────────────
const createStaff = async (req, res, next) => {
  try {
    const result = await svc.registerStaff(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

// ─── GET /api/registrar/users ────────────────────────────────────────────────
const getUsers = async (req, res, next) => {
  try {
    const { role, search, limit, offset } = req.query;
    const result = await svc.listUsers({
      role:   role   || null,
      search: search || null,
      limit:  Math.min(parseInt(limit)  || 30, 100),
      offset: parseInt(offset) || 0,
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// ─── GET /api/registrar/users/:id ────────────────────────────────────────────
const getUser = async (req, res, next) => {
  try {
    const user = await svc.getUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// ─── POST /api/registrar/users/:id/reset-password ────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.status(422).json({ success: false, message: 'new_password must be at least 6 characters.' });
    }
    await svc.resetUserPassword(req.params.id, new_password);
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) { next(err); }
};

// ─── PATCH /api/registrar/users/:id/status ───────────────────────────────────
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    await svc.setUserStatus(req.params.id, status);
    res.json({ success: true, message: `User status updated to ${status}.` });
  } catch (err) { next(err); }
};

module.exports = {
  createStudent,
  createParent,
  createTeacher,
  createStaff,
  getUsers,
  getUser,
  resetPassword,
  updateStatus,
};
