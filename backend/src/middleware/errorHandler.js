/**
 * Global error handler — catches anything passed to next(err).
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message);

  // Postgres constraint violations
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry — this record already exists.',
    });
  }
  if (err.code === '23503') {
    return res.status(409).json({
      success: false,
      message: 'Referenced record does not exist.',
    });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
};

module.exports = errorHandler;
