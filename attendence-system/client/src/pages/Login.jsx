import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCustomToken } from 'firebase/auth';
import { GraduationCap, School, UserCheck, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

const Login = () => {
  // Role switcher: 'teacher' | 'student'
  const [role, setRole] = useState('teacher');
  const [isLogin, setIsLogin] = useState(true);

  // Teacher fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Student fields
  const [rollNo, setRollNo] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        localStorage.setItem('user_role', 'teacher');
        toast.success("Signed in as Teacher! Welcome back.");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        localStorage.setItem('user_role', 'teacher');
        toast.success("Teacher account created successfully!");
      }
    } catch (error) {
      toast.error(error.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!rollNo.trim()) {
      return toast.error("Please enter your Roll Number.");
    }
    if (!studentPassword) {
      return toast.error("Please enter your Password.");
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Student Login
        const res = await api.post('/auth/student-login', {
          rollNo: rollNo.trim(),
          password: studentPassword
        });

        if (res.data?.customToken) {
          await signInWithCustomToken(auth, res.data.customToken);
          localStorage.setItem('user_role', 'student');
          localStorage.setItem('student_rollNo', String(res.data.rollNo));
          toast.success(`Welcome back, ${res.data.studentName || 'Student'}!`);
        }
      } else {
        // Student Registration / Set Password
        const res = await api.post('/auth/student-register', {
          rollNo: rollNo.trim(),
          password: studentPassword
        });

        if (res.data?.customToken) {
          await signInWithCustomToken(auth, res.data.customToken);
          localStorage.setItem('user_role', 'student');
          localStorage.setItem('student_rollNo', String(res.data.rollNo));
          toast.success(`Account registered successfully! Welcome, ${res.data.studentName || 'Student'}!`);
        }
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error || error.message || "Authentication failed.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#f1f5f9',
      margin: 0,
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      
      <div className="login-card" style={{ maxWidth: '420px', padding: '35px 30px' }}>
        
        {/* Role Toggle Tabs */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => { setRole('teacher'); setIsLogin(true); }}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              background: role === 'teacher' ? '#ffffff' : 'transparent',
              color: role === 'teacher' ? '#2563eb' : '#64748b',
              boxShadow: role === 'teacher' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <School size={18} /> Teacher
          </button>
          
          <button
            type="button"
            onClick={() => { setRole('student'); setIsLogin(true); }}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              background: role === 'student' ? '#ffffff' : 'transparent',
              color: role === 'student' ? '#2563eb' : '#64748b',
              boxShadow: role === 'student' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <GraduationCap size={18} /> Student
          </button>
        </div>

        <div className="icon-header">
          {role === 'teacher' ? <School size={30} color="white" /> : <GraduationCap size={30} color="white" />}
        </div>
        
        <h2 style={{ margin: '0 0 6px 0', color: '#1e293b', fontSize: '1.45rem', fontWeight: 'bold' }}>
          {role === 'teacher' ? 'Teacher Portal' : 'Student Portal'}
        </h2>
        
        <p style={{ color: '#64748b', marginBottom: '22px', marginTop: 0, fontSize: '0.95rem' }}>
          {role === 'teacher' 
            ? (isLogin ? 'Sign in with your teacher email' : 'Create teacher account')
            : (isLogin ? 'Sign in with your Roll Number' : 'First time? Register your Roll Number')}
        </p>

        {role === 'teacher' ? (
          /* ================= TEACHER FORM ================= */
          <form onSubmit={handleTeacherSubmit} className="login-form">
            <input
              type="email"
              placeholder="Teacher Email address"
              className="input-style"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="input-style"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In as Teacher' : 'Create Teacher Account')}
            </button>
          </form>
        ) : (
          /* ================= STUDENT FORM ================= */
          <form onSubmit={handleStudentSubmit} className="login-form">
            <input
              type="text"
              placeholder="Your Roll Number (e.g. 1, 2, 101)"
              className="input-style"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder={isLogin ? "Your Password" : "Create Password (min. 4 characters)"}
              className="input-style"
              value={studentPassword}
              onChange={(e) => setStudentPassword(e.target.value)}
              required
            />
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In as Student' : 'Register / Set Password')}
            </button>
          </form>
        )}

        {/* Toggle between Sign In and Sign Up / Register */}
        <p 
          onClick={() => setIsLogin(!isLogin)} 
          className="toggle-auth" 
          style={{ cursor: 'pointer', color: '#64748b', marginTop: '20px', fontSize: '0.9rem', transition: '0.2s' }}
          onMouseOver={(e) => e.target.style.color = '#2563eb'}
          onMouseOut={(e) => e.target.style.color = '#64748b'}
        >
          {role === 'teacher' 
            ? (isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In')
            : (isLogin ? "First time logging in? Click here to Register" : 'Already set a password? Sign In')}
        </p>

      </div>
      
    </div>
  );
};

export default Login;