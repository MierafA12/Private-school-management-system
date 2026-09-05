/**
 * Global error handler — catches anything passed to next(err).
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message);

  // Postgres constraint violations
  if (err.code === '23505') {
    let msg = 'Duplicate entry — this record already exists.';

    const constraint = err.constraint || '';
    const message = err.message || '';

    if (constraint === 'academic_years_name_key' || message.includes('academic_years_name_key')) {
      msg = 'An academic year with this name already exists. Please choose a different year name.';
    } else if (constraint === 'uq_academic_years_one_current' || message.includes('uq_academic_years_one_current')) {
      msg = 'Another academic year is already marked as current. Please deactivate it first.';
    } else if (constraint === 'uq_terms_name_per_year' || message.includes('uq_terms_name_per_year')) {
      msg = 'A term with this name already exists in this academic year.';
    } else if (constraint === 'uq_timetables_section_period_day' || message.includes('uq_timetables_section_period_day')) {
      msg = 'This section already has a class scheduled for this period and day.';
    } else if (constraint === 'uq_timetables_teacher_period_day' || message.includes('uq_timetables_teacher_period_day')) {
      msg = 'This teacher is already scheduled for another class in this period and day.';
    } else if (constraint === 'uq_attendance_sessions_daily' || message.includes('uq_attendance_sessions_daily')) {
      msg = 'Daily attendance has already been recorded for this section on this date.';
    } else if (constraint === 'uq_attendance_records_session_student' || message.includes('uq_attendance_records_session_student')) {
      msg = 'Attendance record for this student already exists in this session.';
    } else if (constraint === 'uq_enrollments_student_year' || message.includes('uq_enrollments_student_year')) {
      msg = 'This student is already enrolled in this academic year.';
    } else if (constraint === 'uq_class_advisors_section_year' || message.includes('uq_class_advisors_section_year')) {
      msg = 'This section already has a class advisor assigned for this academic year.';
    } else if (constraint === 'uq_curriculum_subjects_year_class_subject' || constraint === 'uq_curriculum_subjects_class_subject' || message.includes('curriculum_subjects')) {
      msg = 'This subject is already assigned to this class for this academic year.';
    } else if (constraint === 'uq_sections_name_per_class' || message.includes('uq_sections_name_per_class')) {
      msg = 'A section with this name already exists in this class.';
    } else if (constraint === 'classes_name_key' || message.includes('classes_name_key')) {
      msg = 'A class with this name already exists.';
    } else if (constraint === 'subjects_code_key' || message.includes('subjects_code_key')) {
      msg = 'A subject with this code already exists.';
    } else if (constraint === 'students_student_number_key' || message.includes('students_student_number_key')) {
      msg = 'A student with this student number already exists.';
    } else if (constraint === 'students_admission_number_key' || message.includes('students_admission_number_key')) {
      msg = 'A student with this admission number already exists.';
    } else if (constraint === 'teachers_employee_number_key' || message.includes('teachers_employee_number_key') || constraint === 'staff_employee_number_key' || message.includes('staff_employee_number_key')) {
      msg = 'An employee with this ID/number already exists.';
    } else if (constraint === 'uq_student_parents_student_parent' || message.includes('uq_student_parents_student_parent')) {
      msg = 'This parent is already linked to this student.';
    } else if (constraint.includes('email') || message.includes('email')) {
      msg = 'A user with this email address already exists.';
    } else if (constraint.includes('phone') || message.includes('phone')) {
      msg = 'A user with this phone number already exists.';
    } else if (err.detail) {
      msg = `Record already exists: ${err.detail}`;
    }

    return res.status(409).json({
      success: false,
      message: msg,
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
