const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
require('dotenv').config();

const pool         = require('./src/db');
const authRoutes      = require('./src/routes/authRoutes');
const studentRoutes   = require('./src/routes/studentRoutes');
const registrarRoutes = require('./src/routes/registrarRoutes');
const parentRoutes        = require('./src/routes/parentRoutes');
const accountantRoutes    = require('./src/routes/accountantRoutes');
const notificationRoutes  = require('./src/routes/notificationRoutes');
const overdueCheck        = require('./src/jobs/overdueInvoiceCheck');
const errorHandler = require('./src/middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security & Parsing ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const rateLimitJson = (msg) => (_req, res) => {
  res.status(429).json({ success: false, message: msg });
};

const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             30,
  standardHeaders: true,
  legacyHeaders:   false,
  handler:         rateLimitJson('Too many login attempts. Please try again in 15 minutes.'),
});

const apiLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             200,
  standardHeaders: true,
  legacyHeaders:   false,
  handler:         rateLimitJson('Too many requests. Please slow down.'),
});

app.use('/api/auth',    authLimiter);
app.use('/api',         apiLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/student',  studentRoutes);
app.use('/api/registrar', registrarRoutes);
app.use('/api/parent',         parentRoutes);
app.use('/api/accountant',    accountantRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'School Management System API is running.' });
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', database: err.message });
  }
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`  Health:     http://localhost:${PORT}/health`);
  console.log(`  Auth:       http://localhost:${PORT}/api/auth`);
  console.log(`  Student:    http://localhost:${PORT}/api/student`);
  console.log(`  Registrar:  http://localhost:${PORT}/api/registrar`);
  console.log(`  Parent:        http://localhost:${PORT}/api/parent`);
  console.log(`  Accountant:    http://localhost:${PORT}/api/accountant`);
  console.log(`  Notifications: http://localhost:${PORT}/api/notifications`);

  // ── Overdue invoice check — runs daily at 06:00 ──────────────────────────
  try {
    const cron = require('node-cron');
    cron.schedule('0 6 * * *', () => overdueCheck.run());
    console.log('  Cron: overdue invoice check scheduled at 06:00 daily');
  } catch (_) {
    console.log('  Tip: npm install node-cron to enable scheduled overdue checks');
  }
});
