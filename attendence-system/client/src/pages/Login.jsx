import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast'; // Import the modern popup

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Signed in successfully! Welcome back.");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Account created successfully!");
      }
    } catch (error) {
      // Clean up the ugly Firebase error messages before showing them
      toast.error(error.message.replace('Firebase: ', ''));
    }
  };

  return (
    // Strict inline styles to guarantee perfect full-screen centering
    <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#f1f5f9',
        margin: 0,
        padding: 0
    }}>
      
      <div className="login-card">
        <div className="icon-header">
          <GraduationCap size={32} color="white" />
        </div>
        
        {/* Fixed Font Visibility! Forced dark color and proper spacing */}
        <h2 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '1.5rem', fontWeight: 'bold' }}>
          Attendance System
        </h2>
        
        <p style={{ color: '#64748b', marginBottom: '25px', marginTop: 0 }}>
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Email"
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
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p 
          onClick={() => setIsLogin(!isLogin)} 
          className="toggle-auth" 
          style={{ cursor: 'pointer', color: '#64748b', marginTop: '20px', fontSize: '0.9rem', transition: '0.2s' }}
          onMouseOver={(e) => e.target.style.color = '#2563eb'}
          onMouseOut={(e) => e.target.style.color = '#64748b'}
        >
          {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
        </p>
      </div>
      
    </div>
  );
};

export default Login;