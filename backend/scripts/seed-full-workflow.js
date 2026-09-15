/**
 * seed-full-workflow.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Seeds a complete, testable school workflow across all portals.
 *
 * Accounts created:
 *   teacher@school.com     / Teacher@1234
 *   student@school.com     / Student@1234
 *   parent@school.com      / Parent@1234   (linked to student)
 *   accountant@school.com  / Acct@1234
 *
 * Structure:
 *   Academic Year 2026/2027 → 3 Terms (Term 1 active)
 *   Grade 9 / Section A
 *   4 Subjects (Maths, English, Amharic, Biology)
 *   Timetable — 4 published slots
 *   5 Attendance sessions + records
 *   Exam schedule + mark components + student marks
 *   2 Assignments (individual + group)
 *   Fee structure + invoice ETB 1,500 (for Chapa payment test)
 *   2 Announcements
 *
 * Safe to run multiple times — skips existing records.
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const { Pool }  = require('pg');
const bcrypt    = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SALT  = 10;
const TODAY = new Date().toISOString().split('T')[0];

// ── helpers ──────────────────────────────────────────────────────────────────
const getRoleId = async (c, name) => {
  const { rows } = await c.query(`SELECT id FROM roles WHERE name=$1 LIMIT 1`, [name]);
  if (!rows.length) throw new Error(`Role "${name}" not found. Run migrations first.`);
  return rows[0].id;
};

const findUser = async (c, email) => {
  const { rows } = await c.query(
    `SELECT id FROM users WHERE LOWER(email)=LOWER($1)`, [email]
  );
  return rows[0]?.id || null;
};

const createUser = async (c, email, password, role) => {
  const existing = await findUser(c, email);
  if (existing) return existing;
  const roleId = await getRoleId(c, role);
  const hash   = await bcrypt.hash(password, SALT);
  const { rows } = await c.query(
    `INSERT INTO users (role_id, email, password_hash, status)
     VALUES ($1,$2,$3,'ACTIVE') RETURNING id`,
    [roleId, email.toLowerCase(), hash]
  );
  return rows[0].id;
};

const exists = async (c, table, where, params) => {
  const { rows } = await c.query(`SELECT id FROM ${table} WHERE ${where} LIMIT 1`, params);
  return rows[0]?.id || null;
};

const ok   = (msg) => console.log(`  ✓  ${msg}`);
const skip = (msg) => console.log(`  ⚠  ${msg} — skipped (already exists)`);

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const c = await pool.connect();

  try {
    console.log('\n🌱  Seeding full workflow…\n');

    // ── School Profile ────────────────────────────────────────────────────────
    {
      const { rows } = await c.query(`SELECT id FROM school_profile LIMIT 1`);
      if (!rows.length) {
        await c.query(`
          INSERT INTO school_profile
            (name, motto, address, city, country, phone, email, currency, terms_per_year)
          VALUES
            ('Haile-Manas Academy','Excellence Through Discipline',
             'Debre Berhan, Amhara Region','Debre Berhan','Ethiopia',
             '+251116610000','info@hailemanas.edu.et','ETB',3)`);
        ok('School profile');
      } else { skip('School profile'); }
    }

    // ── Academic Year ─────────────────────────────────────────────────────────
    let ayId = await exists(c, 'academic_years', "name='2026/2027'", []);
    if (!ayId) {
      const { rows } = await c.query(
        `INSERT INTO academic_years (name,start_date,end_date,is_current,status)
         VALUES ('2026/2027','2026-09-01','2027-07-31',TRUE,'ACTIVE') RETURNING id`
      );
      ayId = rows[0].id;
      ok('Academic year 2026/2027');
    } else {
      await c.query(`UPDATE academic_years SET is_current=TRUE WHERE id=$1`, [ayId]);
      skip('Academic year 2026/2027');
    }

    // ── Terms ─────────────────────────────────────────────────────────────────
    const termDefs = [
      { name:'Term 1', start:'2026-09-01', end:'2026-11-30', status:'ACTIVE'   },
      { name:'Term 2', start:'2027-01-06', end:'2027-03-31', status:'UPCOMING' },
      { name:'Term 3', start:'2027-04-07', end:'2027-07-11', status:'UPCOMING' },
    ];
    const termIds = [];
    for (const t of termDefs) {
      let tid = await exists(c, 'terms',
        'name=$1 AND academic_year_id=$2', [t.name, ayId]);
      if (!tid) {
        const { rows } = await c.query(
          `INSERT INTO terms (academic_year_id,name,start_date,end_date,status)
           VALUES ($1,$2,$3,$4,$5) RETURNING id`,
          [ayId, t.name, t.start, t.end, t.status]
        );
        tid = rows[0].id;
        ok(`Term: ${t.name}`);
      } else { skip(`Term: ${t.name}`); }
      termIds.push(tid);
    }
    const [term1Id] = termIds;

    // ── Class ─────────────────────────────────────────────────────────────────
    let classId = await exists(c, 'classes', "name='Grade 9'", []);
    if (!classId) {
      const { rows } = await c.query(
        `INSERT INTO classes (name,grade_level,description)
         VALUES ('Grade 9',9,'Senior secondary') RETURNING id`
      );
      classId = rows[0].id;
      ok('Class: Grade 9');
    } else { skip('Class: Grade 9'); }

    // ── Section ───────────────────────────────────────────────────────────────
    let sectionId = await exists(c, 'sections',
      "class_id=$1 AND name='A'", [classId]);
    if (!sectionId) {
      const { rows } = await c.query(
        `INSERT INTO sections (class_id,name,capacity) VALUES ($1,'A',45) RETURNING id`,
        [classId]
      );
      sectionId = rows[0].id;
      ok('Section: 9A');
    } else { skip('Section: 9A'); }

    // ── Subjects ──────────────────────────────────────────────────────────────
    const subjectDefs = [
      { name:'Mathematics', code:'MATH9' },
      { name:'English',     code:'ENG9'  },
      { name:'Amharic',     code:'AMH9'  },
      { name:'Biology',     code:'BIO9'  },
    ];
    const subIds = {};
    for (const s of subjectDefs) {
      let sid = await exists(c, 'subjects', 'code=$1', [s.code]);
      if (!sid) {
        const { rows } = await c.query(
          `INSERT INTO subjects (name,code) VALUES ($1,$2) RETURNING id`,
          [s.name, s.code]
        );
        sid = rows[0].id;
        ok(`Subject: ${s.name}`);
      } else { skip(`Subject: ${s.name}`); }
      subIds[s.code] = sid;
    }

    // ── Grading Scales ────────────────────────────────────────────────────────
    {
      const { rows } = await c.query(`SELECT COUNT(*) AS n FROM grading_scales`);
      if (parseInt(rows[0].n) === 0) {
        await c.query(`
          INSERT INTO grading_scales (name,min_percentage,max_percentage,label,is_pass,sort_order)
          VALUES ('A+',90,100,'Excellent',TRUE,1),('A',80,89,'Very Good',TRUE,2),
                 ('B+',75,79,'Good',TRUE,3),('B',70,74,'Above Average',TRUE,4),
                 ('C+',65,69,'Average',TRUE,5),('C',60,64,'Satisfactory',TRUE,6),
                 ('D',50,59,'Below Average',TRUE,7),('F',0,49,'Fail',FALSE,8)`);
        ok('Grading scales');
      } else { skip('Grading scales'); }
    }

    // ── Accountant ────────────────────────────────────────────────────────────
    let acctUserId = await findUser(c, 'accountant@school.com');
    if (!acctUserId) {
      acctUserId = await createUser(c, 'accountant@school.com', 'Acct@1234', 'Accountant');
      await c.query(
        `INSERT INTO staff (user_id,employee_number,first_name,last_name,gender,hire_date,employment_status)
         VALUES ($1,'STF-0010','Mekdes','Tadesse','Female',$2,'ACTIVE')`,
        [acctUserId, TODAY]
      );
      ok('Accountant: accountant@school.com / Acct@1234');
    } else { skip('Accountant user'); }

    // ── Teacher ───────────────────────────────────────────────────────────────
    let teacherUserId = await findUser(c, 'teacher@school.com');
    let teacherId;
    if (!teacherUserId) {
      teacherUserId = await createUser(c, 'teacher@school.com', 'Teacher@1234', 'Teacher');
      const { rows } = await c.query(
        `INSERT INTO teachers
           (user_id,employee_number,first_name,last_name,gender,
            qualification,specialization,hire_date,employment_status)
         VALUES ($1,'TCH-0001','Solomon','Bekele','Male',
                 'BSc Mathematics — Addis Ababa University',
                 'Mathematics & Sciences',$2,'ACTIVE')
         RETURNING id`,
        [teacherUserId, TODAY]
      );
      teacherId = rows[0].id;
      ok('Teacher: teacher@school.com / Teacher@1234');
    } else {
      const { rows } = await c.query(
        `SELECT id FROM teachers WHERE user_id=$1`, [teacherUserId]
      );
      teacherId = rows[0]?.id;
      skip('Teacher user');
    }

    // ── Curriculum Subjects ───────────────────────────────────────────────────
    // curriculum_subjects has: academic_year_id, class_id, subject_id
    // NO section_id, NO teacher_id (added via patch if needed)
    const csIds = {};
    for (const s of subjectDefs) {
      let csid = await exists(c, 'curriculum_subjects',
        'academic_year_id=$1 AND class_id=$2 AND subject_id=$3',
        [ayId, classId, subIds[s.code]]
      );
      if (!csid) {
        const { rows } = await c.query(
          `INSERT INTO curriculum_subjects
             (academic_year_id,class_id,subject_id,is_core,weekly_periods)
           VALUES ($1,$2,$3,TRUE,5) RETURNING id`,
          [ayId, classId, subIds[s.code]]
        );
        csid = rows[0].id;
        ok(`Curriculum subject: ${s.name} → Grade 9`);
      } else { skip(`Curriculum subject: ${s.name}`); }
      csIds[s.code] = csid;
    }

    // ── Student ───────────────────────────────────────────────────────────────
    let studentUserId = await findUser(c, 'student@school.com');
    let studentId;
    if (!studentUserId) {
      studentUserId = await createUser(c, 'student@school.com', 'Student@1234', 'Student');
      const { rows } = await c.query(
        `INSERT INTO students
           (user_id,student_number,first_name,last_name,gender,date_of_birth,
            address,emergency_contact_name,emergency_contact_phone,
            admission_date,current_status)
         VALUES ($1,'STU-2026-00001','Dawit','Alemu','Male','2010-04-15',
                 'Debre Berhan, Amhara Region',
                 'Almaz Alemu','+251912345678',
                 $2,'ACTIVE')
         RETURNING id`,
        [studentUserId, TODAY]
      );
      studentId = rows[0].id;
      ok('Student: student@school.com / Student@1234');
    } else {
      const { rows } = await c.query(
        `SELECT id FROM students WHERE user_id=$1`, [studentUserId]
      );
      studentId = rows[0]?.id;
      skip('Student user');
    }

    // ── Parent ────────────────────────────────────────────────────────────────
    let parentUserId = await findUser(c, 'parent@school.com');
    let parentId;
    if (!parentUserId) {
      parentUserId = await createUser(c, 'parent@school.com', 'Parent@1234', 'Parent');
      const { rows } = await c.query(
        `INSERT INTO parents
           (user_id,first_name,last_name,gender,relationship,
            address,emergency_phone)
         VALUES ($1,'Almaz','Alemu','Female','Mother',
                 'Debre Berhan, Amhara','+251912345678')
         RETURNING id`,
        [parentUserId]
      );
      parentId = rows[0].id;
      ok('Parent: parent@school.com / Parent@1234');
    } else {
      const { rows } = await c.query(
        `SELECT id FROM parents WHERE user_id=$1`, [parentUserId]
      );
      parentId = rows[0]?.id;
      skip('Parent user');
    }

    // ── Parent ↔ Student link ─────────────────────────────────────────────────
    if (parentId && studentId) {
      const lnk = await exists(c, 'student_parents',
        'parent_id=$1 AND student_id=$2', [parentId, studentId]);
      if (!lnk) {
        await c.query(
          `INSERT INTO student_parents (parent_id,student_id) VALUES ($1,$2)`,
          [parentId, studentId]
        );
        ok('Parent ↔ Student linked');
      } else { skip('Parent ↔ Student link'); }
    }

    // ── Enrolment ─────────────────────────────────────────────────────────────
    let enrollmentId = await exists(c, 'enrollments',
      "student_id=$1 AND academic_year_id=$2 AND enrollment_status='ACTIVE'",
      [studentId, ayId]
    );
    if (!enrollmentId) {
      const { rows } = await c.query(
        `INSERT INTO enrollments
           (student_id,class_id,section_id,academic_year_id,
            enrollment_date,enrollment_status)
         VALUES ($1,$2,$3,$4,$5,'ACTIVE') RETURNING id`,
        [studentId, classId, sectionId, ayId, TODAY]
      );
      enrollmentId = rows[0].id;
      ok('Enrolment: Dawit Alemu → Grade 9A');
    } else { skip('Enrolment'); }

    // ── Class Advisor ─────────────────────────────────────────────────────────
    if (teacherId) {
      const ca = await exists(c, 'class_advisors',
        'academic_year_id=$1 AND section_id=$2', [ayId, sectionId]);
      if (!ca) {
        await c.query(
          `INSERT INTO class_advisors
             (teacher_id,class_id,section_id,academic_year_id,assigned_date)
           VALUES ($1,$2,$3,$4,$5)`,
          [teacherId, classId, sectionId, ayId, TODAY]
        );
        ok('Class advisor: Solomon Bekele → Grade 9A');
      } else { skip('Class advisor'); }
    }

    // ── Timetable ─────────────────────────────────────────────────────────────
    // timetable columns: academic_year_id, term_id, class_id, section_id,
    //   curriculum_subject_id, teacher_id, day_of_week, period_number,
    //   start_time, end_time, room_number
    // NO is_published column in the migration
    if (teacherId) {
      const slots = [
        { day:'Monday',    p:1, s:'08:00', e:'08:45', code:'MATH9' },
        { day:'Monday',    p:2, s:'08:50', e:'09:35', code:'ENG9'  },
        { day:'Tuesday',   p:1, s:'08:00', e:'08:45', code:'AMH9'  },
        { day:'Wednesday', p:1, s:'08:00', e:'08:45', code:'BIO9'  },
      ];
      let created = 0;
      for (const sl of slots) {
        const tt = await exists(c, 'timetables',
          'term_id=$1 AND section_id=$2 AND day_of_week=$3 AND period_number=$4',
          [term1Id, sectionId, sl.day, sl.p]
        );
        if (!tt) {
          await c.query(
            `INSERT INTO timetables
               (academic_year_id,term_id,class_id,section_id,
                curriculum_subject_id,teacher_id,
                day_of_week,period_number,start_time,end_time,room_number)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Room 9A')`,
            [ayId, term1Id, classId, sectionId,
             csIds[sl.code], teacherId,
             sl.day, sl.p, sl.s, sl.e]
          );
          created++;
        }
      }
      created ? ok(`Timetable: ${created} slots for Grade 9A`) : skip('Timetable slots');
    }

    // ── Attendance Sessions + Records ─────────────────────────────────────────
    // attendance_sessions: teacher_id (FK teachers), attendance_date, created_by (FK users)
    // attendance_records: attendance_session_id, attendance_status, marked_by (FK users)
    // Enum: 'Present','Absent','Late','Excused'
    if (teacherId && studentId) {
      const attDates    = ['2026-09-02','2026-09-03','2026-09-04','2026-09-07','2026-09-08'];
      const attStatuses = ['Present',   'Present',   'Absent',    'Late',      'Present'   ];
      let created = 0;
      for (let i = 0; i < attDates.length; i++) {
        const sesId_existing = await exists(c, 'attendance_sessions',
          "section_id=$1 AND attendance_date=$2 AND attendance_type='DAILY'",
          [sectionId, attDates[i]]
        );
        let sesId = sesId_existing;
        if (!sesId) {
          const { rows } = await c.query(
            `INSERT INTO attendance_sessions
               (academic_year_id,term_id,class_id,section_id,
                teacher_id,attendance_date,attendance_type,created_by)
             VALUES ($1,$2,$3,$4,$5,$6,'DAILY',$7) RETURNING id`,
            [ayId, term1Id, classId, sectionId, teacherId, attDates[i], teacherUserId]
          );
          sesId = rows[0].id;
          created++;
        }
        // Record for student
        const rec = await exists(c, 'attendance_records',
          'attendance_session_id=$1 AND student_id=$2', [sesId, studentId]);
        if (!rec) {
          await c.query(
            `INSERT INTO attendance_records
               (attendance_session_id,student_id,attendance_status,marked_by)
             VALUES ($1,$2,$3,$4)`,
            [sesId, studentId, attStatuses[i], teacherUserId]
          );
        }
      }
      created
        ? ok(`Attendance: ${attDates.length} sessions + records (mix of Present/Absent/Late)`)
        : skip('Attendance sessions');
    }

    // ── Exam Schedule ─────────────────────────────────────────────────────────
    let examId = await exists(c, 'exam_schedules',
      'term_id=$1 AND class_id=$2 AND section_id=$3 AND curriculum_subject_id=$4',
      [term1Id, classId, sectionId, csIds['MATH9']]
    );
    if (!examId) {
      const { rows } = await c.query(
        `INSERT INTO exam_schedules
           (term_id,academic_year_id,class_id,section_id,
            curriculum_subject_id,title,exam_date,
            start_time,end_time,venue,is_published,created_by)
         VALUES ($1,$2,$3,$4,$5,
                 'Mathematics — Term 1 Final',
                 '2026-11-15','08:00','10:00',
                 'Main Exam Hall',TRUE,$6)
         RETURNING id`,
        [term1Id, ayId, classId, sectionId, csIds['MATH9'], teacherUserId]
      );
      examId = rows[0].id;
      ok('Exam schedule: Mathematics Term 1');
    } else { skip('Exam schedule'); }

    // ── Mark Components + Student Marks ──────────────────────────────────────
    const compDefs = [
      { name:'Assignment', max:30, obtained:25 },
      { name:'Final Exam', max:70, obtained:58 },
    ];
    for (const comp of compDefs) {
      let compId = await exists(c, 'mark_components',
        'exam_schedule_id=$1 AND name=$2', [examId, comp.name]);
      if (!compId) {
        const { rows } = await c.query(
          `INSERT INTO mark_components
             (exam_schedule_id,name,max_marks,sort_order)
           VALUES ($1,$2,$3,$4) RETURNING id`,
          [examId, comp.name, comp.max, compDefs.indexOf(comp) + 1]
        );
        compId = rows[0].id;
        ok(`  Mark component: ${comp.name} (${comp.max} marks)`);
      } else { skip(`  Mark component: ${comp.name}`); }

      if (studentId) {
        const mrk = await exists(c, 'student_marks',
          'mark_component_id=$1 AND student_id=$2', [compId, studentId]);
        if (!mrk) {
          await c.query(
            `INSERT INTO student_marks
               (mark_component_id,student_id,marks_obtained,is_absent,entered_by)
             VALUES ($1,$2,$3,FALSE,$4)`,
            [compId, studentId, comp.obtained, teacherUserId]
          );
          ok(`  Mark entered: ${comp.obtained}/${comp.max}`);
        } else { skip(`  Mark: ${comp.name}`); }
      }
    }

    // ── Assignments ───────────────────────────────────────────────────────────
    if (teacherId) {
      // Individual
      const a1 = await exists(c, 'assignments',
        "title='Mathematics Homework #1' AND class_id=$1", [classId]);
      if (!a1) {
        await c.query(
          `INSERT INTO assignments
             (title,description,curriculum_subject_id,class_id,section_id,
              teacher_id,assignment_type,due_date,max_marks,instructions,is_published)
           VALUES ('Mathematics Homework #1',
                   'Solve Chapter 3 exercises 1–20',
                   $1,$2,$3,$4,'individual','2026-09-22',20,
                   'Show all working. Use a pencil.',TRUE)`,
          [csIds['MATH9'], classId, sectionId, teacherId]
        );
        ok('Assignment: Mathematics Homework #1 (individual, published)');
      } else { skip('Assignment: Mathematics Homework #1'); }

      // Group
      let ga = await exists(c, 'assignments',
        "title='Biology Group Project' AND class_id=$1", [classId]);
      if (!ga) {
        const { rows } = await c.query(
          `INSERT INTO assignments
             (title,description,curriculum_subject_id,class_id,section_id,
              teacher_id,assignment_type,due_date,max_marks,instructions,is_published)
           VALUES ('Biology Group Project',
                   'Research and present on the human digestive system',
                   $1,$2,$3,$4,'group','2026-10-06',30,
                   'Groups of 3–5. Prepare poster + 10-min presentation.',TRUE)
           RETURNING id`,
          [csIds['BIO9'], classId, sectionId, teacherId]
        );
        ga = rows[0].id;
        ok('Assignment: Biology Group Project (group, published)');

        const { rows: gr } = await c.query(
          `INSERT INTO assignment_groups (assignment_id,group_name)
           VALUES ($1,'Group Alpha') RETURNING id`,
          [ga]
        );
        await c.query(
          `INSERT INTO assignment_group_members (group_id,student_id) VALUES ($1,$2)`,
          [gr[0].id, studentId]
        );
        ok('  Group Alpha → Dawit Alemu added');
      } else { skip('Assignment: Biology Group Project'); }
    }

    // ── Fee Structure ─────────────────────────────────────────────────────────
    let fsId = await exists(c, 'fee_structures',
      "academic_year_id=$1 AND class_id=$2 AND category='Tuition Fee'",
      [ayId, classId]
    );
    if (!fsId) {
      const { rows } = await c.query(
        `INSERT INTO fee_structures
           (academic_year_id,term_id,class_id,category,fee_type,description,
            amount,currency,is_mandatory,status,created_by)
         VALUES ($1,$2,$3,'Tuition Fee','Tuition Fee','Term 1 tuition — Grade 9',
                 1500.00,'ETB',TRUE,'ACTIVE',$4)
         RETURNING id`,
        [ayId, term1Id, classId, acctUserId]
      );
      fsId = rows[0].id;
      ok('Fee structure: Tuition Fee ETB 1,500 (Term 1 / Grade 9)');
    } else { skip('Fee structure'); }

    // ── Fee Invoice ───────────────────────────────────────────────────────────
    if (enrollmentId && fsId) {
      const inv = await exists(c, 'fee_invoices',
        'student_id=$1 AND term_id=$2 AND fee_structure_id=$3',
        [studentId, term1Id, fsId]
      );
      if (!inv) {
        await c.query(
          `INSERT INTO fee_invoices
             (invoice_number,student_id,enrollment_id,term_id,
              fee_structure_id,total_amount,amount_paid,balance,
              currency,due_date,status,created_by)
           VALUES ('INV-2026-90001',$1,$2,$3,$4,
                   1500.00,0.00,1500.00,'ETB','2026-10-15','UNPAID',$5)`,
          [studentId, enrollmentId, term1Id, fsId, acctUserId]
        );
        ok('Fee invoice: INV-2026-90001 — ETB 1,500 UNPAID (due Oct 15)');
      } else { skip('Fee invoice'); }
    }

    // ── Announcements ─────────────────────────────────────────────────────────
    const annDefs = [
      {
        title:'Welcome Back — Term 1 2026/2027',
        body: 'Welcome to the new academic year. Term 1 starts September 1st. Students must arrive by 7:45 AM.',
        audience:'ALL', priority:'HIGH',
      },
      {
        title:'Fee Payment Deadline — October 15',
        body: 'Term 1 tuition fees are due October 15, 2026. Pay securely via the parent portal using Chapa (Telebirr, CBE Birr, Awash Bank, Card).',
        audience:'PARENTS', priority:'NORMAL',
      },
    ];
    for (const ann of annDefs) {
      const a = await exists(c, 'announcements', 'title=$1', [ann.title]);
      if (!a) {
        await c.query(
          `INSERT INTO announcements
             (title,body,audience,priority,is_published,publish_at,created_by)
           VALUES ($1,$2,$3,$4,TRUE,NOW(),$5)`,
          [ann.title, ann.body, ann.audience, ann.priority, acctUserId]
        );
        ok(`Announcement: "${ann.title}"`);
      } else { skip(`Announcement: "${ann.title}"`); }
    }

    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n✅  Seed complete!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  TEST ACCOUNTS');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Principal    admin@school.com       Admin@1234');
    console.log('  Registrar    registrar@school.com   Reg@1234');
    console.log('  Teacher      teacher@school.com     Teacher@1234');
    console.log('  Accountant   accountant@school.com  Acct@1234');
    console.log('  Parent       parent@school.com      Parent@1234');
    console.log('  Student      student@school.com     Student@1234');
    console.log('');
    console.log('  PAYMENT TEST:');
    console.log('  Login as parent@school.com → Fee Payments');
    console.log('  Invoice INV-2026-90001 — ETB 1,500 UNPAID');
    console.log('  Click Pay → redirects to Chapa checkout');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (err) {
    await c.query('ROLLBACK').catch(() => {});
    console.error('\n❌  Seed failed:', err.message);
    process.exit(1);
  } finally {
    c.release();
    await pool.end();
  }
}

main();
