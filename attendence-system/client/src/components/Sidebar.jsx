import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, CheckSquare, BarChart3, GraduationCap, School, LogOut, BookOpen } from 'lucide-react';
import { auth } from '../firebase';
import toast from 'react-hot-toast';

const Sidebar = ({ user, role, rollNo }) => {
  const isStudent = role === 'student' || (user?.uid && user.uid.startsWith('student_'));

  const handleSignOut = () => {
    localStorage.removeItem('user_role');
    localStorage.removeItem('student_rollNo');
    auth.signOut()
      .then(() => toast.success("Signed out successfully!"))
      .catch((error) => toast.error("Error signing out."));
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="icon-box" style={{ background: isStudent ? '#10b981' : '#2563eb' }}>
          {isStudent ? <GraduationCap size={24} color="white" /> : <School size={24} color="white" />}
        </div>
        <div>
          <h3 style={{ margin: 0, color: 'white' }}>Attendance</h3>
          <span style={{ 
            color: isStudent ? '#6ee7b7' : '#94a3b8', 
            fontSize: '0.82rem', 
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {isStudent ? 'Student Portal' : 'Teacher Panel'}
          </span>
        </div>
      </div>

      <nav>
        {isStudent ? (
          /* Student Navigation Links */
          <>
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end>
              <BarChart3 size={20} /> My Attendance
            </NavLink>
          </>
        ) : (
          /* Teacher Navigation Links */
          <>
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end>
              <Users size={20} /> Dashboard
            </NavLink>
            
            <NavLink to="/attendance" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <CheckSquare size={20} /> Attendance
            </NavLink>
            
            <NavLink to="/reports" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <BarChart3 size={20} /> Reports
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ textAlign: 'center', width: '100%' }}>
          {isStudent ? (
            <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.9rem', fontWeight: '500' }}>
              Roll Number: <strong>{rollNo || 'Student'}</strong>
            </p>
          ) : (
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', wordBreak: 'break-all' }}>
              {user?.email}
            </p>
          )}
        </div>

        <button onClick={handleSignOut} className="logout-btn">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;