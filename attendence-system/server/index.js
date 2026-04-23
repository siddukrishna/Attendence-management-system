const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const serviceAccount = require('./serviceAccountKey.json');

const app = express();
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

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

app.use('/api', verifyToken);

// ==========================================
// 1. CREATE CLASS 
// ==========================================
app.post('/api/classes', async (req, res) => {
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
// 2. GET CLASSES 
// ==========================================
app.get('/api/classes', async (req, res) => {
  try {
    const snapshot = await db.collection('classes').where('teacherId', '==', req.user.uid).get();
    const classes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(classes);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 3. DELETE CLASS (New)
// ==========================================
app.delete('/api/classes/:classId', async (req, res) => {
  try {
    const classRef = db.collection('classes').doc(req.params.classId);
    const doc = await classRef.get();
    
    // Security check: Make sure this teacher owns the class
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
// 5. DELETE STUDENT (New)
// ==========================================
app.delete('/api/classes/:classId/students/:studentId', async (req, res) => {
  try {
    await db.collection('classes').doc(req.params.classId).collection('students').doc(req.params.studentId).delete();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 6. SAVE ATTENDANCE
// ==========================================
app.post('/api/attendance', async (req, res) => {
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

app.listen(5000, () => console.log('🚀 Secure Server running on http://localhost:5000'));