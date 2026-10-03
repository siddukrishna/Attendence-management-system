const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const crypto = require('crypto');
const serviceAccount = require('./serviceAccountKey.json');

const app = express();
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// ==========================================
// PASSWORD UTILITIES FOR STUDENTS
// ==========================================
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

// ==========================================
// HELPER: FIND CLASSES FOR A ROLL NUMBER
// ==========================================
async function findClassesForRollNo(rollNo) {
  if (!rollNo) return [];
  const rollStr = String(rollNo).trim();
  const rollLower = rollStr.toLowerCase();
  const rollNum = Number(rollStr);

  const classesSnapshot = await db.collection('classes').get();
  const matchedClasses = [];

  for (const classDoc of classesSnapshot.docs) {
    const classData = classDoc.data();
    const studentsSnapshot = await classDoc.ref.collection('students').get();
    
    const matchingStudent = studentsSnapshot.docs.find(doc => {
      const s = doc.data();
      const sName = String(s.name || '').trim();
      const sNameLower = sName.toLowerCase();
      const sRollStr = String(s.rollNo !== undefined && s.rollNo !== null ? s.rollNo : '').trim();
      const sRollLower = sRollStr.toLowerCase();
      const sRollNum = Number(s.rollNo);

      // 1. Direct match on rollNo (numeric or string)
      if (!isNaN(rollNum) && sRollNum === rollNum) return true;
      if (sRollLower && sRollLower === rollLower) return true;

      // 2. Direct match on student name (teachers often enter roll no as student name)
      if (sNameLower === rollLower) return true;

      // 3. Name contains roll number (e.g. 'A24126510009 - John')
      if (sNameLower.includes(rollLower)) return true;

      return false;
    });

    if (matchingStudent) {
      const studentData = matchingStudent.data();
      matchedClasses.push({
        classId: classDoc.id,
        className: classData.className || 'Unnamed Class',
        subjects: classData.subjects || [],
        studentId: matchingStudent.id,
        studentName: studentData.name || `Student ${rollStr}`,
        rollNo: studentData.rollNo
      });
    }
  }

  return matchedClasses;
}

// ==========================================
// PUBLIC STUDENT AUTH ROUTES (NO TOKEN NEEDED)
// ==========================================
app.post('/api/auth/student-register', async (req, res) => {
  try {
    const { rollNo, password } = req.body;
    if (!rollNo || !password) {
      return res.status(400).json({ error: "Roll number and password are required." });
    }
    if (String(password).length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters long." });
    }

    const rollStr = String(rollNo).trim();
    const matchedClasses = await findClassesForRollNo(rollStr);

    if (matchedClasses.length === 0) {
      return res.status(404).json({
        error: `Roll Number "${rollStr}" is not registered in any class. Please contact your teacher.`
      });
    }

    const docId = rollStr.toUpperCase();
    const accountRef = db.collection('student_accounts').doc(docId);
    const existing = await accountRef.get();
    if (existing.exists) {
      return res.status(400).json({
        error: `An account for Roll Number "${rollStr}" already exists. Please Sign In.`
      });
    }

    const studentName = matchedClasses[0].studentName;
    await accountRef.set({
      rollNo: rollStr,
      studentName,
      passwordHash: hashPassword(password),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const safeUid = `student_${rollStr.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const customToken = await admin.auth().createCustomToken(safeUid, {
      role: 'student',
      rollNo: rollStr,
      studentName
    });

    res.json({
      success: true,
      customToken,
      rollNo: rollStr,
      studentName
    });
  } catch (e) {
    console.error("Student registration error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/student-login', async (req, res) => {
  try {
    const { rollNo, password } = req.body;
    if (!rollNo || !password) {
      return res.status(400).json({ error: "Roll number and password are required." });
    }

    const rollStr = String(rollNo).trim();
    // Validate student is enrolled in at least one class
    const matchedClasses = await findClassesForRollNo(rollStr);
    if (matchedClasses.length === 0) {
      return res.status(404).json({
        error: `Roll Number "${rollStr}" is not present in any class. Access denied.`
      });
    }

    const docId = rollStr.toUpperCase();
    let accountRef = db.collection('student_accounts').doc(docId);
    let accountDoc = await accountRef.get();
    
    // Fallback if registered under exact case
    if (!accountDoc.exists) {
      accountRef = db.collection('student_accounts').doc(rollStr);
      accountDoc = await accountRef.get();
    }

    if (!accountDoc.exists) {
      return res.status(404).json({
        error: `No account found for Roll Number "${rollStr}". Please click "First time? Register" to set your password.`
      });
    }

    const accountData = accountDoc.data();
    if (!verifyPassword(password, accountData.passwordHash)) {
      return res.status(401).json({ error: "Incorrect password. Please try again." });
    }

    const studentName = matchedClasses[0].studentName;
    const safeUid = `student_${rollStr.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const customToken = await admin.auth().createCustomToken(safeUid, {
      role: 'student',
      rollNo: rollStr,
      studentName
    });

    res.json({
      success: true,
      customToken,
      rollNo: rollStr,
      studentName
    });
  } catch (e) {
    console.error("Student login error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized. No token provided." });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; 
    next();
  } catch (error) {
    res.status(403).json({ error: "Unauthorized. Invalid token." });
  }
};

// Guard middleware to restrict teacher-only operations
const requireTeacher = (req, res, next) => {
  if (req.user.role === 'student' || (req.user.uid && req.user.uid.startsWith('student_'))) {
    return res.status(403).json({ error: "Access denied. Teachers only." });
  }
  next();
};

app.use('/api', verifyToken);

// ==========================================
// 1. CREATE CLASS (Teacher Only)
// ==========================================
app.post('/api/classes', requireTeacher, async (req, res) => {
  try {
    const { className, subjects, students } = req.body;
    
    const classRef = await db.collection('classes').add({
      className,
      subjects, 
      teacherId: req.user.uid, 
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const batch = db.batch();
    students.forEach((name, index) => {
      const sRef = classRef.collection('students').doc();
      batch.set(sRef, { name, rollNo: index + 1 });
    });
    
    await batch.commit();
    res.json({ id: classRef.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 2. GET CLASSES (Teachers see their classes, students see enrolled classes)
// ==========================================
app.get('/api/classes', async (req, res) => {
  try {
    const isStudent = req.user.role === 'student' || (req.user.uid && req.user.uid.startsWith('student_'));
    if (isStudent) {
      const rollNo = req.user.rollNo || req.user.uid.replace('student_', '');
      const matched = await findClassesForRollNo(rollNo);
      return res.json(matched.map(c => ({ id: c.classId, className: c.className, subjects: c.subjects })));
    }

    const snapshot = await db.collection('classes').where('teacherId', '==', req.user.uid).get();
    const classes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(classes);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 3. DELETE CLASS (Teacher Only)
// ==========================================
app.delete('/api/classes/:classId', requireTeacher, async (req, res) => {
  try {
    const classRef = db.collection('classes').doc(req.params.classId);
    const doc = await classRef.get();
    
    if (!doc.exists || doc.data().teacherId !== req.user.uid) {
      return res.status(403).json({ error: "Unauthorized to delete this class." });
    }
    
    await classRef.delete();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 4. GET STUDENTS
// ==========================================
app.get('/api/classes/:classId/students', async (req, res) => {
  try {
    const snapshot = await db.collection('classes').doc(req.params.classId).collection('students').orderBy('rollNo').get();
    const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(students);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 5. DELETE STUDENT (Teacher Only)
// ==========================================
app.delete('/api/classes/:classId/students/:studentId', requireTeacher, async (req, res) => {
  try {
    await db.collection('classes').doc(req.params.classId).collection('students').doc(req.params.studentId).delete();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 6. SAVE ATTENDANCE (Teacher Only)
// ==========================================
app.post('/api/attendance', requireTeacher, async (req, res) => {
  try {
    const { classId, date, subject, records } = req.body;
    await db.collection('classes').doc(classId).collection('attendance').add({
      date, subject, records, createdAt: new Date()
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 7. GET REPORTS
// ==========================================
app.get('/api/classes/:classId/reports', async (req, res) => {
  try {
    const snapshot = await db.collection('classes').doc(req.params.classId).collection('attendance').orderBy('date', 'desc').get();
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(reports);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 8. STUDENT ATTENDANCE PORTAL
// ==========================================
app.get('/api/student/my-attendance', async (req, res) => {
  try {
    const isStudent = req.user.role === 'student' || (req.user.uid && req.user.uid.startsWith('student_'));
    const rollNo = req.user.rollNo || (req.user.uid && req.user.uid.startsWith('student_') ? req.user.uid.replace('student_', '') : req.query.rollNo);

    if (!rollNo) {
      return res.status(400).json({ error: "No roll number found for this account." });
    }

    const rollStr = String(rollNo).trim();
    const matchedClasses = await findClassesForRollNo(rollStr);

    if (matchedClasses.length === 0) {
      return res.json({
        rollNo: rollStr,
        studentName: '',
        classes: [],
        attendanceRecords: [],
        summary: { total: 0, present: 0, absent: 0, percentage: 0 }
      });
    }

    const studentName = matchedClasses[0].studentName;
    const allRecords = [];
    let totalPresent = 0;
    let totalAbsent = 0;

    for (const cls of matchedClasses) {
      const attSnapshot = await db.collection('classes').doc(cls.classId).collection('attendance').orderBy('date', 'desc').get();
      for (const doc of attSnapshot.docs) {
        const data = doc.data();
        if (data.records && data.records[cls.studentId] !== undefined) {
          const status = data.records[cls.studentId]; // 'P' or 'A'
          if (status === 'P') totalPresent++;
          if (status === 'A') totalAbsent++;

          allRecords.push({
            id: doc.id,
            classId: cls.classId,
            className: cls.className,
            date: data.date,
            subject: data.subject,
            status: status
          });
        }
      }
    }

    allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalSessions = totalPresent + totalAbsent;
    const percentage = totalSessions > 0 ? Number(((totalPresent / totalSessions) * 100).toFixed(1)) : 0;

    res.json({
      rollNo: rollStr,
      studentName,
      classes: matchedClasses.map(c => ({ id: c.classId, className: c.className, subjects: c.subjects })),
      attendanceRecords: allRecords,
      summary: {
        total: totalSessions,
        present: totalPresent,
        absent: totalAbsent,
        percentage
      }
    });
  } catch (e) {
    console.error("Error fetching student attendance:", e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(5000, () => console.log('🚀 Secure Server running on http://localhost:5000'));