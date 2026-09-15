/**
 * seed-demo.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Full demo seed: 3 classes, 3 sections, 6 teachers, 18 students, 6 parents,
 * timetables, attendance, exams, marks, assignments, invoices, announcements.
 *
 * Usage: node scripts/seed-demo.js
 * Safe to re-run — all inserts are idempotent.
 * ─────────────────────────────────────────────────────────────────────────────
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt   = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const SALT = 10;
const TODAY = new Date().toISOString().split('T')[0];

// ── helpers ──────────────────────────────────────────────────────────────────
const q    = (sql, p=[]) => pool.query(sql, p);
const one  = async (sql, p=[]) => { const { rows } = await q(sql,p); return rows[0]; };
const all  = async (sql, p=[]) => { const { rows } = await q(sql,p); return rows; };
const find = async (table, where, params) => {
  const r = await all(`SELECT id FROM ${table} WHERE ${where} LIMIT 1`, params);
  return r[0]?.id || null;
};
const hash = p => bcrypt.hash(p, SALT);
const ok   = m => process.stdout.write(`  ✓  ${m}\n`);
const skip = m => process.stdout.write(`  ⚠  ${m} — skipped\n`);

const getRole = async name => {
  const r = await one(`SELECT id FROM roles WHERE name=$1`, [name]);
  if (!r) throw new Error(`Role "${name}" not found. Run migrations first.`);
  return r.id;
};

const upsertUser = async (email, password, roleName) => {
  const ex = await find('users', 'LOWER(email)=LOWER($1)', [email]);
  if (ex) return ex;
  const roleId = await getRole(roleName);
  const h = await hash(password);
  const r = await one(
    `INSERT INTO users (role_id,email,password_hash,status) VALUES ($1,$2,$3,'ACTIVE') RETURNING id`,
    [roleId, email.toLowerCase(), h]
  );
  return r.id;
};

// ═════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('\n🌱  Running full demo seed…\n');

  // ── School profile ──────────────────────────────────────────────────────────
  {
    const ex = await find('school_profile', '1=1', []);
    if (!ex) {
      await q(`INSERT INTO school_profile
        (name,motto,address,city,country,phone,email,currency,terms_per_year)
        VALUES ('Haile-Manas Academy',
                'Excellence Through Discipline and Knowledge',
                'Haile-Manas Road, Kebele 03','Debre Berhan','Ethiopia',
                '+251116610001','info@hailemanas.edu.et','ETB',3)`);
      ok('School profile');
    } else { skip('School profile'); }
  }

  // ── Academic year ───────────────────────────────────────────────────────────
  let ayId = await find('academic_years', "name='2026/2027'", []);
  if (!ayId) {
    const r = await one(`INSERT INTO academic_years (name,start_date,end_date,is_current,status)
      VALUES ('2026/2027','2026-09-01','2027-07-31',TRUE,'ACTIVE') RETURNING id`);
    ayId = r.id; ok('Academic year 2026/2027 (current)');
  } else { await q(`UPDATE academic_years SET is_current=TRUE WHERE id=$1`,[ayId]); skip('Academic year'); }

  // ── Terms ───────────────────────────────────────────────────────────────────
  const termDefs = [
    { name:'Term 1', s:'2026-09-01', e:'2026-11-30', status:'ACTIVE'   },
    { name:'Term 2', s:'2027-01-06', e:'2027-03-31', status:'UPCOMING' },
    { name:'Term 3', s:'2027-04-07', e:'2027-07-11', status:'UPCOMING' },
  ];
  const tIds = {};
  for (const t of termDefs) {
    let id = await find('terms','name=$1 AND academic_year_id=$2',[t.name,ayId]);
    if (!id) {
      const r = await one(`INSERT INTO terms (academic_year_id,name,start_date,end_date,status)
        VALUES ($1,$2,$3,$4,$5) RETURNING id`,[ayId,t.name,t.s,t.e,t.status]);
      id = r.id; ok(`Term: ${t.name}`);
    } else { skip(`Term: ${t.name}`); }
    tIds[t.name] = id;
  }
  const term1 = tIds['Term 1'];

  // ── Classes ─────────────────────────────────────────────────────────────────
  const classDefs = [
    { name:'Grade 7', level:7 },
    { name:'Grade 8', level:8 },
    { name:'Grade 9', level:9 },
  ];
  const classIds = {};
  for (const c of classDefs) {
    let id = await find('classes','name=$1',[c.name]);
    if (!id) {
      const r = await one(`INSERT INTO classes (name,grade_level) VALUES ($1,$2) RETURNING id`,[c.name,c.level]);
      id = r.id; ok(`Class: ${c.name}`);
    } else { skip(`Class: ${c.name}`); }
    classIds[c.name] = id;
  }

  // ── Sections (A & B per class) ──────────────────────────────────────────────
  const secIds = {};  // e.g. 'Grade 7-A'
  for (const cls of classDefs) {
    for (const sec of ['A','B']) {
      const key = `${cls.name}-${sec}`;
      let id = await find('sections','class_id=$1 AND name=$2',[classIds[cls.name],sec]);
      if (!id) {
        const r = await one(`INSERT INTO sections (class_id,name,capacity) VALUES ($1,$2,40) RETURNING id`,
          [classIds[cls.name],sec]);
        id = r.id; ok(`Section: ${key}`);
      } else { skip(`Section: ${key}`); }
      secIds[key] = id;
    }
  }

  // ── Subjects ────────────────────────────────────────────────────────────────
  const subjectDefs = [
    { name:'Mathematics',  code:'MATH' },
    { name:'English',      code:'ENG'  },
    { name:'Amharic',      code:'AMH'  },
    { name:'Biology',      code:'BIO'  },
    { name:'Physics',      code:'PHY'  },
    { name:'Chemistry',    code:'CHEM' },
    { name:'History',      code:'HIST' },
    { name:'Geography',    code:'GEO'  },
    { name:'Physical Education', code:'PE' },
  ];
  const subIds = {};
  for (const s of subjectDefs) {
    let id = await find('subjects','code=$1',[s.code]);
    if (!id) {
      const r = await one(`INSERT INTO subjects (name,code) VALUES ($1,$2) RETURNING id`,[s.name,s.code]);
      id = r.id; ok(`Subject: ${s.name}`);
    } else { skip(`Subject: ${s.name}`); }
    subIds[s.code] = id;
  }

  // ── Grading scales ──────────────────────────────────────────────────────────
  { const { rows } = await q(`SELECT COUNT(*) n FROM grading_scales`);
    if (+rows[0].n === 0) {
      await q(`INSERT INTO grading_scales (name,min_percentage,max_percentage,label,is_pass,sort_order) VALUES
        ('A+',90,100,'Excellent',TRUE,1),('A',80,89,'Very Good',TRUE,2),
        ('B+',75,79,'Good',TRUE,3),('B',70,74,'Above Average',TRUE,4),
        ('C+',65,69,'Average',TRUE,5),('C',60,64,'Satisfactory',TRUE,6),
        ('D',50,59,'Below Average',TRUE,7),('F',0,49,'Fail',FALSE,8)`);
      ok('Grading scales');
    } else { skip('Grading scales'); } }

  // ── Staff accounts ──────────────────────────────────────────────────────────
  // Accountant
  let acctUID = await find('users','LOWER(email)=LOWER($1)',['accountant@school.com']);
  if (!acctUID) {
    acctUID = await upsertUser('accountant@school.com','Acct@1234','Accountant');
    await q(`INSERT INTO staff (user_id,employee_number,first_name,last_name,gender,hire_date,employment_status)
      VALUES ($1,'STF-0001','Mekdes','Tadesse','Female',$2,'ACTIVE')`,[acctUID,TODAY]);
    ok('Accountant: accountant@school.com / Acct@1234');
  } else { skip('Accountant'); }

  // ── Teachers ────────────────────────────────────────────────────────────────
  const teacherDefs = [
    { email:'teacher1@school.com', pass:'Teacher@1', fn:'Solomon',  ln:'Bekele',   gender:'Male',
      emp:'TCH-0001', qual:'BSc Mathematics — Addis Ababa University', spec:'Mathematics' },
    { email:'teacher2@school.com', pass:'Teacher@2', fn:'Hiwot',    ln:'Girma',    gender:'Female',
      emp:'TCH-0002', qual:'BA English Literature — Bahir Dar University', spec:'English' },
    { email:'teacher3@school.com', pass:'Teacher@3', fn:'Tesfaye',  ln:'Alemu',    gender:'Male',
      emp:'TCH-0003', qual:'BSc Biology — Hawassa University', spec:'Natural Sciences' },
    { email:'teacher4@school.com', pass:'Teacher@4', fn:'Tigist',   ln:'Kebede',   gender:'Female',
      emp:'TCH-0004', qual:'BA Amharic — Gondar University', spec:'Amharic Language' },
    { email:'teacher5@school.com', pass:'Teacher@5', fn:'Biruk',    ln:'Haile',    gender:'Male',
      emp:'TCH-0005', qual:'BSc Physics — Mekelle University', spec:'Physics & Chemistry' },
    { email:'teacher6@school.com', pass:'Teacher@6', fn:'Selamawit','ln':'Worku',  gender:'Female',
      emp:'TCH-0006', qual:'BSc Geography — Addis Ababa University', spec:'Social Studies' },
  ];
  // fix object key typo above
  teacherDefs[5].fn = 'Selamawit'; teacherDefs[5].ln = 'Worku';

  const tUIds = {}; // email → user_id
  const tIds2 = {}; // email → teacher.id
  for (const t of teacherDefs) {
    let uid = await find('users','LOWER(email)=LOWER($1)',[t.email]);
    let tid;
    if (!uid) {
      uid = await upsertUser(t.email, t.pass, 'Teacher');
      const r = await one(
        `INSERT INTO teachers
           (user_id,employee_number,first_name,last_name,gender,
            qualification,specialization,hire_date,employment_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ACTIVE') RETURNING id`,
        [uid,t.emp,t.fn,t.ln,t.gender,t.qual,t.spec,TODAY]
      );
      tid = r.id; ok(`Teacher: ${t.email} / ${t.pass}`);
    } else {
      const r2 = await one(`SELECT id FROM teachers WHERE user_id=$1`,[uid]);
      tid = r2?.id; skip(`Teacher: ${t.email}`);
    }
    tUIds[t.email] = uid;
    tIds2[t.email] = tid;
  }
  const [t1uid,t2uid,t3uid,t4uid,t5uid,t6uid] = teacherDefs.map(t=>tUIds[t.email]);
  const [t1id, t2id, t3id, t4id, t5id, t6id]  = teacherDefs.map(t=>tIds2[t.email]);

  // ── Curriculum subjects (class-level, no section_id) ────────────────────────
  // Grade 7: Maths, English, Amharic, Biology, History, PE
  // Grade 8: Maths, English, Amharic, Biology, Geography, PE
  // Grade 9: Maths, English, Amharic, Biology, Physics, Chemistry
  const csMap = {}; // 'Grade 7-MATH' → cs_id
  const csCurriculum = [
    { cls:'Grade 7', subs:['MATH','ENG','AMH','BIO','HIST','PE'] },
    { cls:'Grade 8', subs:['MATH','ENG','AMH','BIO','GEO','PE']  },
    { cls:'Grade 9', subs:['MATH','ENG','AMH','BIO','PHY','CHEM'] },
  ];
  for (const { cls, subs } of csCurriculum) {
    for (const code of subs) {
      const key = `${cls}-${code}`;
      let id = await find('curriculum_subjects',
        'academic_year_id=$1 AND class_id=$2 AND subject_id=$3',
        [ayId, classIds[cls], subIds[code]]);
      if (!id) {
        const r = await one(
          `INSERT INTO curriculum_subjects (academic_year_id,class_id,subject_id,is_core,weekly_periods)
           VALUES ($1,$2,$3,TRUE,5) RETURNING id`,
          [ayId, classIds[cls], subIds[code]]
        );
        id = r.id; ok(`Curriculum: ${cls} – ${code}`);
      } else { skip(`Curriculum: ${key}`); }
      csMap[key] = id;
    }
  }

  // ── Students (6 per class = 18 total) ────────────────────────────────────────
  const studentDefs = [
    // Grade 7A
    { email:'student.g7a1@school.com', pass:'Student@1', fn:'Abebe',   ln:'Bekele',   gender:'Male',   dob:'2011-03-12', cls:'Grade 7', sec:'A', snum:'STU-2026-00101' },
    { email:'student.g7a2@school.com', pass:'Student@2', fn:'Hiwot',   ln:'Alemu',    gender:'Female', dob:'2011-07-22', cls:'Grade 7', sec:'A', snum:'STU-2026-00102' },
    { email:'student.g7a3@school.com', pass:'Student@3', fn:'Dawit',   ln:'Girma',    gender:'Male',   dob:'2011-11-05', cls:'Grade 7', sec:'A', snum:'STU-2026-00103' },
    // Grade 7B
    { email:'student.g7b1@school.com', pass:'Student@4', fn:'Sara',    ln:'Haile',    gender:'Female', dob:'2011-04-18', cls:'Grade 7', sec:'B', snum:'STU-2026-00104' },
    { email:'student.g7b2@school.com', pass:'Student@5', fn:'Yonas',   ln:'Tadesse',  gender:'Male',   dob:'2011-09-30', cls:'Grade 7', sec:'B', snum:'STU-2026-00105' },
    { email:'student.g7b3@school.com', pass:'Student@6', fn:'Meron',   ln:'Kebede',   gender:'Female', dob:'2011-01-14', cls:'Grade 7', sec:'B', snum:'STU-2026-00106' },
    // Grade 8A
    { email:'student.g8a1@school.com', pass:'Student@7', fn:'Biruk',   ln:'Worku',    gender:'Male',   dob:'2010-06-08', cls:'Grade 8', sec:'A', snum:'STU-2026-00107' },
    { email:'student.g8a2@school.com', pass:'Student@8', fn:'Tigist',  ln:'Mulugeta', gender:'Female', dob:'2010-02-25', cls:'Grade 8', sec:'A', snum:'STU-2026-00108' },
    { email:'student.g8a3@school.com', pass:'Student@9', fn:'Nahom',   ln:'Tesfaye',  gender:'Male',   dob:'2010-08-17', cls:'Grade 8', sec:'A', snum:'STU-2026-00109' },
    // Grade 8B
    { email:'student.g8b1@school.com', pass:'Stud10@x',  fn:'Eyerusalem', ln:'Hailu', gender:'Female', dob:'2010-12-03', cls:'Grade 8', sec:'B', snum:'STU-2026-00110' },
    { email:'student.g8b2@school.com', pass:'Stud11@x',  fn:'Kaleb',  ln:'Assefa',   gender:'Male',   dob:'2010-05-21', cls:'Grade 8', sec:'B', snum:'STU-2026-00111' },
    { email:'student.g8b3@school.com', pass:'Stud12@x',  fn:'Liya',   ln:'Solomon',  gender:'Female', dob:'2010-10-09', cls:'Grade 8', sec:'B', snum:'STU-2026-00112' },
    // Grade 9A
    { email:'student.g9a1@school.com', pass:'Stud13@x',  fn:'Dawit',  ln:'Alemu',    gender:'Male',   dob:'2009-04-15', cls:'Grade 9', sec:'A', snum:'STU-2026-00113' },
    { email:'student.g9a2@school.com', pass:'Stud14@x',  fn:'Selam',  ln:'Bekele',   gender:'Female', dob:'2009-08-22', cls:'Grade 9', sec:'A', snum:'STU-2026-00114' },
    { email:'student.g9a3@school.com', pass:'Stud15@x',  fn:'Abel',   ln:'Girma',    gender:'Male',   dob:'2009-01-11', cls:'Grade 9', sec:'A', snum:'STU-2026-00115' },
    // Grade 9B
    { email:'student.g9b1@school.com', pass:'Stud16@x',  fn:'Nardos', ln:'Haile',    gender:'Female', dob:'2009-06-30', cls:'Grade 9', sec:'B', snum:'STU-2026-00116' },
    { email:'student.g9b2@school.com', pass:'Stud17@x',  fn:'Mikael', ln:'Tesfaye',  gender:'Male',   dob:'2009-11-17', cls:'Grade 9', sec:'B', snum:'STU-2026-00117' },
    { email:'student.g9b3@school.com', pass:'Stud18@x',  fn:'Frehiwot','ln':'Worku',  gender:'Female', dob:'2009-03-05', cls:'Grade 9', sec:'B', snum:'STU-2026-00118' },
  ];
  studentDefs[17].fn = 'Frehiwot'; studentDefs[17].ln = 'Worku';

  const sUIds = {}; // email → user_id
  const sIds  = {}; // email → student.id
  const sEnr  = {}; // email → enrollment.id

  for (const s of studentDefs) {
    let uid = await find('users','LOWER(email)=LOWER($1)',[s.email]);
    let sid, enrId;
    if (!uid) {
      uid = await upsertUser(s.email, s.pass, 'Student');
      const rs = await one(
        `INSERT INTO students
           (user_id,student_number,first_name,last_name,gender,date_of_birth,
            address,emergency_contact_name,emergency_contact_phone,
            admission_date,current_status)
         VALUES ($1,$2,$3,$4,$5,$6,
                 'Debre Berhan, Amhara Region',
                 $7,'+251911000000',$8,'ACTIVE') RETURNING id`,
        [uid,s.snum,s.fn,s.ln,s.gender,s.dob,
         `${s.fn} Parent`, TODAY]
      );
      sid = rs.id; ok(`Student: ${s.fn} ${s.ln} (${s.snum}) → ${s.cls}${s.sec}`);
    } else {
      const rs2 = await one(`SELECT id FROM students WHERE user_id=$1`,[uid]);
      sid = rs2?.id; skip(`Student: ${s.email}`);
    }
    sUIds[s.email] = uid;
    sIds[s.email]  = sid;

    // Enrolment
    if (sid) {
      let enrId_ex = await find('enrollments',
        "student_id=$1 AND academic_year_id=$2 AND enrollment_status='ACTIVE'",
        [sid, ayId]);
      if (!enrId_ex) {
        const re = await one(
          `INSERT INTO enrollments
             (student_id,class_id,section_id,academic_year_id,enrollment_date,enrollment_status)
           VALUES ($1,$2,$3,$4,$5,'ACTIVE') RETURNING id`,
          [sid,classIds[s.cls],secIds[`${s.cls}-${s.sec}`],ayId,TODAY]
        );
        enrId_ex = re.id;
      }
      sEnr[s.email] = enrId_ex;
    }
  }

  // ── Parents (one per pair, linked to 2–3 students) ──────────────────────────
  const parentDefs = [
    { email:'parent1@school.com', pass:'Parent@1', fn:'Almaz',    ln:'Bekele',   gender:'Female', rel:'Mother',
      children:['student.g7a1@school.com','student.g9a1@school.com'] },
    { email:'parent2@school.com', pass:'Parent@2', fn:'Tesfaye',  ln:'Alemu',    gender:'Male',   rel:'Father',
      children:['student.g7a2@school.com','student.g8a2@school.com'] },
    { email:'parent3@school.com', pass:'Parent@3', fn:'Mekdes',   ln:'Girma',    gender:'Female', rel:'Mother',
      children:['student.g7a3@school.com'] },
    { email:'parent4@school.com', pass:'Parent@4', fn:'Habtamu',  ln:'Haile',    gender:'Male',   rel:'Father',
      children:['student.g7b1@school.com','student.g9b1@school.com'] },
    { email:'parent5@school.com', pass:'Parent@5', fn:'Tigist',   ln:'Tadesse',  gender:'Female', rel:'Mother',
      children:['student.g7b2@school.com','student.g8b2@school.com'] },
    { email:'parent6@school.com', pass:'Parent@6', fn:'Kebede',   ln:'Worku',    gender:'Male',   rel:'Father',
      children:['student.g7b3@school.com','student.g8b3@school.com','student.g9b3@school.com'] },
  ];

  const pUIds = {};
  for (const p of parentDefs) {
    let uid = await find('users','LOWER(email)=LOWER($1)',[p.email]);
    let pid;
    if (!uid) {
      uid = await upsertUser(p.email, p.pass, 'Parent');
      const rp = await one(
        `INSERT INTO parents
           (user_id,first_name,last_name,gender,relationship,
            address,emergency_phone)
         VALUES ($1,$2,$3,$4,$5,'Debre Berhan, Amhara','+251911000001') RETURNING id`,
        [uid,p.fn,p.ln,p.gender,p.rel]
      );
      pid = rp.id; ok(`Parent: ${p.email} / ${p.pass}`);
    } else {
      const rp2 = await one(`SELECT id FROM parents WHERE user_id=$1`,[uid]);
      pid = rp2?.id; skip(`Parent: ${p.email}`);
    }
    pUIds[p.email] = uid;

    // Link children
    if (pid) {
      for (const ce of p.children) {
        const sid = sIds[ce];
        if (!sid) continue;
        const lnk = await find('student_parents','parent_id=$1 AND student_id=$2',[pid,sid]);
        if (!lnk) {
          await q(`INSERT INTO student_parents (parent_id,student_id) VALUES ($1,$2)`,[pid,sid]);
          ok(`  Linked ${p.fn} → student ${ce}`);
        }
      }
    }
  }

  // ── Class advisors ──────────────────────────────────────────────────────────
  const advisorMap = [
    { cls:'Grade 7', sec:'A', tid:t1id },
    { cls:'Grade 7', sec:'B', tid:t2id },
    { cls:'Grade 8', sec:'A', tid:t3id },
    { cls:'Grade 8', sec:'B', tid:t4id },
    { cls:'Grade 9', sec:'A', tid:t5id },
    { cls:'Grade 9', sec:'B', tid:t6id },
  ];
  for (const a of advisorMap) {
    if (!a.tid) continue;
    const ex = await find('class_advisors','academic_year_id=$1 AND section_id=$2',[ayId,secIds[`${a.cls}-${a.sec}`]]);
    if (!ex) {
      await q(`INSERT INTO class_advisors (teacher_id,class_id,section_id,academic_year_id,assigned_date)
        VALUES ($1,$2,$3,$4,$5)`,
        [a.tid,classIds[a.cls],secIds[`${a.cls}-${a.sec}`],ayId,TODAY]);
      ok(`Class advisor: ${a.cls}${a.sec}`);
    } else { skip(`Class advisor: ${a.cls}${a.sec}`); }
  }

  // ── Timetable ────────────────────────────────────────────────────────────────
  // Subject → teacher assignment by class
  const teacherForSubject = {
    'Grade 7-MATH': t1id, 'Grade 7-ENG': t2id, 'Grade 7-AMH': t4id,
    'Grade 7-BIO':  t3id, 'Grade 7-HIST': t6id, 'Grade 7-PE': t3id,
    'Grade 8-MATH': t1id, 'Grade 8-ENG': t2id, 'Grade 8-AMH': t4id,
    'Grade 8-BIO':  t3id, 'Grade 8-GEO':  t6id, 'Grade 8-PE': t3id,
    'Grade 9-MATH': t1id, 'Grade 9-ENG': t2id, 'Grade 9-AMH': t4id,
    'Grade 9-BIO':  t3id, 'Grade 9-PHY':  t5id, 'Grade 9-CHEM': t5id,
  };

  // Period schedule per section (day, period, sub_code)
  // We stagger per class to avoid teacher double-booking
  const ttDefs = [
    // Grade 7A
    { cls:'Grade 7', sec:'A', slots:[
      {d:'Monday',p:1,s:'08:00',e:'08:45',code:'MATH'},{d:'Monday',p:2,s:'08:50',e:'09:35',code:'ENG'},
      {d:'Tuesday',p:1,s:'08:00',e:'08:45',code:'AMH'},{d:'Tuesday',p:2,s:'08:50',e:'09:35',code:'BIO'},
      {d:'Wednesday',p:1,s:'08:00',e:'08:45',code:'HIST'},{d:'Thursday',p:1,s:'08:00',e:'08:45',code:'PE'},
    ]},
    // Grade 7B — offset by 1 period to avoid teacher clash
    { cls:'Grade 7', sec:'B', slots:[
      {d:'Monday',p:3,s:'10:00',e:'10:45',code:'MATH'},{d:'Monday',p:4,s:'10:50',e:'11:35',code:'ENG'},
      {d:'Tuesday',p:3,s:'10:00',e:'10:45',code:'AMH'},{d:'Tuesday',p:4,s:'10:50',e:'11:35',code:'BIO'},
      {d:'Wednesday',p:2,s:'08:50',e:'09:35',code:'HIST'},{d:'Thursday',p:2,s:'08:50',e:'09:35',code:'PE'},
    ]},
    // Grade 8A
    { cls:'Grade 8', sec:'A', slots:[
      {d:'Monday',p:1,s:'08:00',e:'08:45',code:'BIO'}, {d:'Monday',p:2,s:'08:50',e:'09:35',code:'AMH'},
      {d:'Tuesday',p:1,s:'08:00',e:'08:45',code:'MATH'},{d:'Tuesday',p:2,s:'08:50',e:'09:35',code:'ENG'},
      {d:'Wednesday',p:3,s:'10:00',e:'10:45',code:'GEO'},{d:'Thursday',p:3,s:'10:00',e:'10:45',code:'PE'},
    ]},
    // Grade 8B
    { cls:'Grade 8', sec:'B', slots:[
      {d:'Monday',p:3,s:'10:00',e:'10:45',code:'BIO'}, {d:'Monday',p:4,s:'10:50',e:'11:35',code:'AMH'},
      {d:'Tuesday',p:3,s:'10:00',e:'10:45',code:'MATH'},{d:'Tuesday',p:4,s:'10:50',e:'11:35',code:'ENG'},
      {d:'Wednesday',p:4,s:'10:50',e:'11:35',code:'GEO'},{d:'Thursday',p:4,s:'10:50',e:'11:35',code:'PE'},
    ]},
    // Grade 9A
    { cls:'Grade 9', sec:'A', slots:[
      {d:'Monday',p:1,s:'08:00',e:'08:45',code:'MATH'},{d:'Monday',p:2,s:'08:50',e:'09:35',code:'PHY'},
      {d:'Tuesday',p:1,s:'08:00',e:'08:45',code:'CHEM'},{d:'Tuesday',p:2,s:'08:50',e:'09:35',code:'ENG'},
      {d:'Wednesday',p:1,s:'08:00',e:'08:45',code:'AMH'},{d:'Thursday',p:1,s:'08:00',e:'08:45',code:'BIO'},
    ]},
    // Grade 9B
    { cls:'Grade 9', sec:'B', slots:[
      {d:'Monday',p:3,s:'10:00',e:'10:45',code:'MATH'},{d:'Monday',p:4,s:'10:50',e:'11:35',code:'PHY'},
      {d:'Tuesday',p:3,s:'10:00',e:'10:45',code:'CHEM'},{d:'Tuesday',p:4,s:'10:50',e:'11:35',code:'ENG'},
      {d:'Wednesday',p:2,s:'08:50',e:'09:35',code:'AMH'},{d:'Thursday',p:2,s:'08:50',e:'09:35',code:'BIO'},
    ]},
  ];

  let ttCreated = 0;
  for (const { cls, sec, slots } of ttDefs) {
    const secId = secIds[`${cls}-${sec}`];
    const cid   = classIds[cls];
    for (const sl of slots) {
      const teacherKey = `${cls}-${sl.code}`;
      const tid = teacherForSubject[teacherKey];
      const csid = csMap[`${cls}-${sl.code}`];
      if (!tid || !csid) continue;

      const ex = await find('timetables',
        'term_id=$1 AND section_id=$2 AND day_of_week=$3 AND period_number=$4',
        [term1, secId, sl.d, sl.p]);
      if (!ex) {
        try {
          await q(`INSERT INTO timetables
            (academic_year_id,term_id,class_id,section_id,
             curriculum_subject_id,teacher_id,
             day_of_week,period_number,start_time,end_time,room_number)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [ayId,term1,cid,secId,csid,tid,sl.d,sl.p,sl.s,sl.e,`Room ${cls.replace('Grade ','')}-${sec}`]);
          ttCreated++;
        } catch (e) {
          // skip teacher double-booking conflicts silently
          if (!e.message.includes('uq_timetables')) throw e;
        }
      }
    }
  }
  ok(`Timetable: ${ttCreated} slots created across 6 sections`);

  // ── Attendance (5 days, all sections, all students) ──────────────────────────
  const attDates = ['2026-09-02','2026-09-03','2026-09-04','2026-09-07','2026-09-08'];
  const statusPool = ['Present','Present','Present','Late','Absent'];
  let attCreated = 0;
  for (const [email, sid] of Object.entries(sIds)) {
    if (!sid) continue;
    const s  = studentDefs.find(x => x.email === email);
    const sec = secIds[`${s.cls}-${s.sec}`];
    const cid = classIds[s.cls];
    // find advisor teacher
    const adv = advisorMap.find(a => a.cls===s.cls && a.sec===s.sec);
    const tid  = adv?.tid;
    const tuid = tid ? (await one(`SELECT user_id FROM teachers WHERE id=$1`,[tid]))?.user_id : null;
    if (!tid || !tuid) continue;

    for (let i=0; i<attDates.length; i++) {
      let sesId = await find('attendance_sessions',
        "section_id=$1 AND attendance_date=$2 AND attendance_type='DAILY'",
        [sec, attDates[i]]);
      if (!sesId) {
        const rs = await one(
          `INSERT INTO attendance_sessions
             (academic_year_id,term_id,class_id,section_id,
              teacher_id,attendance_date,attendance_type,created_by)
           VALUES ($1,$2,$3,$4,$5,$6,'DAILY',$7) RETURNING id`,
          [ayId,term1,cid,sec,tid,attDates[i],tuid]);
        sesId = rs.id; attCreated++;
      }
      const recEx = await find('attendance_records',
        'attendance_session_id=$1 AND student_id=$2',[sesId,sid]);
      if (!recEx) {
        await q(`INSERT INTO attendance_records
          (attendance_session_id,student_id,attendance_status,marked_by)
          VALUES ($1,$2,$3,$4)`,
          [sesId,sid,statusPool[i % statusPool.length],tuid]);
      }
    }
  }
  ok(`Attendance: ${attCreated} sessions + records for all students`);

  // ── Exam schedule + marks (Grade 9A Mathematics) ────────────────────────────
  let examId = await find('exam_schedules',
    'term_id=$1 AND class_id=$2 AND section_id=$3 AND curriculum_subject_id=$4',
    [term1,classIds['Grade 9'],secIds['Grade 9-A'],csMap['Grade 9-MATH']]);
  if (!examId) {
    const re = await one(
      `INSERT INTO exam_schedules
         (term_id,academic_year_id,class_id,section_id,curriculum_subject_id,
          title,exam_date,start_time,end_time,venue,is_published,created_by)
       VALUES ($1,$2,$3,$4,$5,'Mathematics — Term 1 Final','2026-11-15',
               '08:00','10:00','Main Exam Hall',TRUE,$6) RETURNING id`,
      [term1,ayId,classIds['Grade 9'],secIds['Grade 9-A'],csMap['Grade 9-MATH'],t1uid]);
    examId = re.id; ok('Exam schedule: Grade 9A Mathematics');
  } else { skip('Exam schedule'); }

  const compDefs = [
    { name:'Assignment', max:30 },
    { name:'Mid Exam',   max:30 },
    { name:'Final Exam', max:40 },
  ];
  const compIds = [];
  for (let i=0; i<compDefs.length; i++) {
    const c = compDefs[i];
    let cid2 = await find('mark_components','exam_schedule_id=$1 AND name=$2',[examId,c.name]);
    if (!cid2) {
      const rc = await one(
        `INSERT INTO mark_components (exam_schedule_id,name,max_marks,sort_order)
         VALUES ($1,$2,$3,$4) RETURNING id`,[examId,c.name,c.max,i+1]);
      cid2 = rc.id; ok(`  Component: ${c.name}/${c.max}`);
    } else { skip(`  Component: ${c.name}`); }
    compIds.push({ id:cid2, max:c.max });
  }
  // Enter marks for Grade 9A students
  const g9aStudents = studentDefs.filter(s=>s.cls==='Grade 9'&&s.sec==='A');
  const markSets = [[24,25,35],[20,22,30],[26,27,38]];
  for (let i=0; i<g9aStudents.length; i++) {
    const sid = sIds[g9aStudents[i].email];
    if (!sid) continue;
    const marks = markSets[i % markSets.length];
    for (let j=0; j<compIds.length; j++) {
      const ex = await find('student_marks','mark_component_id=$1 AND student_id=$2',[compIds[j].id,sid]);
      if (!ex) {
        await q(`INSERT INTO student_marks (mark_component_id,student_id,marks_obtained,is_absent,entered_by)
          VALUES ($1,$2,$3,FALSE,$4)`,[compIds[j].id,sid,marks[j],t1uid]);
      }
    }
  }
  ok('Marks entered for Grade 9A students');

  // ── Assignments ──────────────────────────────────────────────────────────────
  const assignDefs = [
    { title:'Mathematics Homework #1', csKey:'Grade 9-MATH', cls:'Grade 9', sec:'A',
      tid:t1id, type:'individual', due:'2026-09-22', max:20,
      desc:'Solve Chapter 3 exercises 1–20. Show all working steps.' },
    { title:'English Essay: My Hometown', csKey:'Grade 9-ENG', cls:'Grade 9', sec:'A',
      tid:t2id, type:'individual', due:'2026-09-28', max:30,
      desc:'Write a 500-word essay describing your hometown.' },
    { title:'Biology Group Project', csKey:'Grade 9-BIO', cls:'Grade 9', sec:'A',
      tid:t3id, type:'group', due:'2026-10-06', max:30,
      desc:'Research and present on the human digestive system. Groups of 3–5.' },
    { title:'Grade 8 Mathematics Test', csKey:'Grade 8-MATH', cls:'Grade 8', sec:'A',
      tid:t1id, type:'individual', due:'2026-09-25', max:25,
      desc:'Chapter 1 & 2 review. Calculator not permitted.' },
    { title:'Amharic Reading Assignment', csKey:'Grade 7-AMH', cls:'Grade 7', sec:'A',
      tid:t4id, type:'individual', due:'2026-09-20', max:15,
      desc:'Read pages 45-60 and answer the comprehension questions.' },
  ];

  for (const a of assignDefs) {
    const ex = await find('assignments','title=$1 AND class_id=$2',[a.title,classIds[a.cls]]);
    if (!ex) {
      const ra = await one(
        `INSERT INTO assignments
           (title,description,curriculum_subject_id,class_id,section_id,
            teacher_id,assignment_type,due_date,max_marks,instructions,is_published)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$2,TRUE) RETURNING id`,
        [a.title,a.desc,csMap[a.csKey],classIds[a.cls],secIds[`${a.cls}-${a.sec}`],
         a.tid,a.type,a.due,a.max]
      );
      // Group assignment — create groups
      if (a.type === 'group') {
        const g9aS = studentDefs.filter(s=>s.cls==='Grade 9'&&s.sec==='A');
        const chunks = [[g9aS[0],g9aS[1]],[g9aS[2]]];
        for (let gi=0; gi<chunks.length; gi++) {
          const grp = await one(
            `INSERT INTO assignment_groups (assignment_id,group_name) VALUES ($1,$2) RETURNING id`,
            [ra.id, `Group ${gi+1}`]);
          for (const ms of chunks[gi]) {
            const msid = sIds[ms.email];
            if (msid) {
              await q(`INSERT INTO assignment_group_members (group_id,student_id) VALUES ($1,$2)`,
                [grp.id,msid]);
            }
          }
        }
      }
      ok(`Assignment: ${a.title}`);
    } else { skip(`Assignment: ${a.title}`); }
  }

  // ── Fee structures + invoices ────────────────────────────────────────────────
  const feeByClass = [
    { cls:'Grade 7', cat:'Tuition Fee', amount:1200 },
    { cls:'Grade 8', cat:'Tuition Fee', amount:1350 },
    { cls:'Grade 9', cat:'Tuition Fee', amount:1500 },
  ];
  const fsIds = {};
  for (const f of feeByClass) {
    let fsid = await find('fee_structures',
      "academic_year_id=$1 AND class_id=$2 AND category='Tuition Fee'",[ayId,classIds[f.cls]]);
    if (!fsid) {
      const rf = await one(
        `INSERT INTO fee_structures
           (academic_year_id,term_id,class_id,category,fee_type,description,
            amount,currency,is_mandatory,status,created_by)
         VALUES ($1,$2,$3,$4,$4,$5,$6,'ETB',TRUE,'ACTIVE',$7) RETURNING id`,
        [ayId,term1,classIds[f.cls],f.cat,`Term 1 tuition — ${f.cls}`,f.amount,acctUID]);
      fsid = rf.id; ok(`Fee structure: ${f.cls} — ETB ${f.amount}`);
    } else { skip(`Fee structure: ${f.cls}`); }
    fsIds[f.cls] = fsid;
  }

  // Invoice per student
  const { rows: invCnt } = await pool.query(
    `SELECT COUNT(*) n FROM fee_invoices WHERE EXTRACT(YEAR FROM created_at)=2026`
  );
  let invNum = parseInt(invCnt[0].n) + 1;
  for (const s of studentDefs) {
    const sid  = sIds[s.email];
    const enrId = sEnr[s.email];
    const fsid = fsIds[s.cls];
    if (!sid || !enrId || !fsid) continue;
    const ex = await find('fee_invoices','student_id=$1 AND term_id=$2 AND fee_structure_id=$3',
      [sid,term1,fsid]);
    if (!ex) {
      const amt = feeByClass.find(f=>f.cls===s.cls).amount;
      await q(`INSERT INTO fee_invoices
        (invoice_number,student_id,enrollment_id,term_id,fee_structure_id,
         total_amount,amount_paid,balance,currency,due_date,status,created_by)
        VALUES ($1,$2,$3,$4,$5,$6,0,$6,'ETB','2026-10-15','UNPAID',$7)`,
        [`INV-2026-${invNum++}`,sid,enrId,term1,fsid,amt,acctUID]);
    }
  }
  ok(`Fee invoices: ${studentDefs.length} invoices created (one per student)`);

  // ── Announcements ─────────────────────────────────────────────────────────────
  const annDefs = [
    { title:'Welcome Back — Term 1 2026/2027',
      body:'Dear students and parents, we warmly welcome you to the new academic year. Term 1 begins September 1st. Students must arrive by 7:45 AM in full uniform.',
      audience:'ALL', priority:'HIGH' },
    { title:'Fee Payment Deadline — October 15, 2026',
      body:'Term 1 tuition fees are due by October 15, 2026. Pay securely via the Parent Portal using Chapa (Telebirr, CBE Birr, Awash Bank, or Card). Contact the finance office for payment queries.',
      audience:'PARENTS', priority:'NORMAL' },
    { title:'Academic Calendar — Key Dates',
      body:'Term 1 exams: November 15–22. Prize-giving Day: November 28. Term 1 ends: November 30. Term 2 begins: January 6, 2027.',
      audience:'ALL', priority:'NORMAL' },
    { title:'Teacher Professional Development Day — September 15',
      body:'Monday September 15 is a student holiday (Teacher PD Day). Normal classes resume Tuesday September 16.',
      audience:'ALL', priority:'HIGH' },
    { title:'Parent-Teacher Conference — October 19',
      body:'All parents are invited to the Term 1 mid-year conference on October 19. Book your 20-minute slot with each teacher via the Parent Portal by October 15.',
      audience:'PARENTS', priority:'HIGH' },
  ];
  for (const ann of annDefs) {
    const ex = await find('announcements','title=$1',[ann.title]);
    if (!ex) {
      await q(`INSERT INTO announcements (title,body,audience,priority,is_published,publish_at,created_by)
        VALUES ($1,$2,$3,$4,TRUE,NOW(),$5)`,
        [ann.title,ann.body,ann.audience,ann.priority,acctUID]);
      ok(`Announcement: "${ann.title}"`);
    } else { skip(`Announcement: "${ann.title}"`); }
  }

  console.log('\n✅  Demo seed complete!\n');
  await pool.end();
}

main().catch(async e => {
  console.error('\n❌  Seed failed:', e.message);
  await pool.end();
  process.exit(1);
});
