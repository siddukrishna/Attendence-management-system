import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, CheckSquare, BarChart3, GraduationCap, LogOut } from 'lucide-react';
import { auth } from '../firebase';
import toast from 'react-hot-toast'; // Import the modern popup

const Sidebar = ({ user }) => {
  
  // Custom Sign Out handler
  const handleSignOut = () => {
    auth.signOut()
      .then(() => toast.success("Signed out successfully!"))
      .catch((error) => toast.error("Error signing out."));
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="icon-box">
          <GraduationCap size={24} color="white" />
        </div>
        <div>
          <h3 style={{ margin: 0, color: 'white' }}>Attendance</h3>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Admin Panel</span>
        </div>
      </div>

      <nav>
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end>
          <Users size={20} /> Dashboard
        </NavLink>
        
        <NavLink to="/attendance" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <CheckSquare size={20} /> Attendance
        </NavLink>
        
        <NavLink to="/reports" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <BarChart3 size={20} /> Reports
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <p>{user?.email}</p>
        {/* Attach the new handler here */}
        <button onClick={handleSignOut} className="logout-btn">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;