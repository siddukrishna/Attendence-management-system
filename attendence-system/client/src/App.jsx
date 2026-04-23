import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { Toaster } from 'react-hot-toast'; // Modern Popups

import Sidebar from './components/Sidebar';
import ClassWizard from './components/ClassWizard';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>Loading App...</div>;

  return (
    <BrowserRouter>
      {/* This enables the modern popups everywhere in the app */}
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      {user ? (
        <div className="app-container">
          <Sidebar user={user} />
          <div className="content">
            <Routes>
              {/* Home Dashboard */}
              <Route path="/" element={<Dashboard title="Overview Dashboard" />} />
              
              {/* Class Creation */}
              <Route path="/create-class" element={<ClassWizard />} />
              
              {/* Attendance Flow: First pick a class, then mark it */}
              <Route path="/attendance" element={<Dashboard title="Select Class to Mark Attendance" />} />
              <Route path="/attendance/:classId" element={<Attendance />} />
              
              {/* Reports */}
              <Route path="/reports" element={<Reports />} />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;