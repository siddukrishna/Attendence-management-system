import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { Toaster } from 'react-hot-toast';

import Sidebar from './components/Sidebar';
import ClassWizard from './components/ClassWizard';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import StudentPortal from './pages/StudentPortal';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(localStorage.getItem('user_role') || null);
  const [rollNo, setRollNo] = useState(localStorage.getItem('student_rollNo') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const tokenResult = await u.getIdTokenResult();
          const isStudent = 
            tokenResult.claims.role === 'student' || 
            (u.uid && u.uid.startsWith('student_')) ||
            localStorage.getItem('user_role') === 'student';

          const detectedRole = isStudent ? 'student' : 'teacher';
          setRole(detectedRole);
          localStorage.setItem('user_role', detectedRole);

          if (isStudent) {
            const detectedRoll = 
              tokenResult.claims.rollNo || 
              (u.uid.startsWith('student_') ? u.uid.replace('student_', '') : null) ||
              localStorage.getItem('student_rollNo');
            
            setRollNo(detectedRoll);
            if (detectedRoll) {
              localStorage.setItem('student_rollNo', String(detectedRoll));
            }
          }
        } catch (e) {
          console.error("Token verification error:", e);
        }
      } else {
        setUser(null);
        setRole(null);
        setRollNo(null);
        localStorage.removeItem('user_role');
        localStorage.removeItem('student_rollNo');
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Attendance App...</div>;

  return (
    <BrowserRouter>
      {/* Toast Notification Container */}
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />

      {user ? (
        <div className="app-container">
          <Sidebar user={user} role={role} rollNo={rollNo} />
          
          <div className="content">
            {role === 'student' ? (
              /* ================= STUDENT ROUTES ================= */
              /* Student can only see attendance and download attendance */
              <Routes>
                <Route path="/" element={<StudentPortal rollNo={rollNo} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            ) : (
              /* ================= TEACHER ROUTES ================= */
              <Routes>
                {/* Home Dashboard */}
                <Route path="/" element={<Dashboard title="Overview Dashboard" />} />
                
                {/* Class Creation */}
                <Route path="/create-class" element={<ClassWizard />} />
                
                {/* Attendance Flow: Pick a class, then mark it */}
                <Route path="/attendance" element={<Dashboard title="Select Class to Mark Attendance" />} />
                <Route path="/attendance/:classId" element={<Attendance />} />
                
                {/* Reports */}
                <Route path="/reports" element={<Reports />} />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            )}
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;