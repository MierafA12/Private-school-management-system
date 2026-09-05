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
  if (err.code === '23514') {
    if (err.constraint === 'chk_terms_dates' || err.message?.includes('chk_terms_dates')) {
      return res.status(400).json({
        success: false,
        message: 'Term end date must be after the start date.',
      });
    }
    if (err.constraint === 'chk_academic_years_dates' || err.message?.includes('chk_academic_years_dates')) {
      return res.status(400).json({
        success: false,
        message: 'Academic year end date must be after the start date.',
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Date range constraint violation: End date must be after start date.',
    });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
};

module.exports = errorHandler;
