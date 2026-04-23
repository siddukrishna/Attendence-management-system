import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Trash2, FolderOpen } from 'lucide-react';
import api from '../api'; 

const Dashboard = ({ title = "My Classes" }) => {
  const [classes, setClasses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/classes')
       .then(res => setClasses(res.data))
       .catch(err => console.error("Error fetching classes:", err));
  }, []);

  const handleDeleteClass = async (e, classId, className) => {
    e.stopPropagation(); 
    if (window.confirm(`Are you sure you want to completely delete "${className}"? This cannot be undone.`)) {
      try {
        await api.delete(`/classes/${classId}`);
        setClasses(classes.filter(c => c.id !== classId));
      } catch (err) {
        alert("Error deleting class. Check console.");
        console.error(err);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      
      {/* FIXED HEADER: Controlled font size, line height, and flex wrapping */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        gap: '15px',
        flexWrap: 'wrap' /* Allows button to drop down if screen is narrow */
      }}>
        <h1 style={{ 
          color: '#1e293b', 
          margin: 0, 
          fontSize: '1.75rem', /* Strictly controls the text size */
          lineHeight: '1.4',   /* Prevents the words from overlapping */
          fontWeight: '700'
        }}>
          {title}
        </h1>
        <button 
          className="btn-primary" 
          onClick={() => navigate('/create-class')}
          style={{ whiteSpace: 'nowrap' }} /* Prevents button text from breaking */
        >
          + Create New Class
        </button>
      </div>
      
      {classes.length > 0 ? (
        <div className="grid">
          {classes.map(c => (
            <div key={c.id} className="card class-card" onClick={() => navigate(`/attendance/${c.id}`)}>
              <div style={{display:'flex', alignItems:'center', justifyContent: 'space-between', marginBottom:'15px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <Users size={24} color="#2563eb" />
                    <h2 style={{margin: 0, color: '#1e293b', fontWeight: 'bold'}}>{c.className}</h2>
                </div>
                
                <button 
                  onClick={(e) => handleDeleteClass(e, c.id, c.className)} 
                  style={{background:'none', border:'none', color:'#f87171', cursor:'pointer', padding:'5px', display: 'flex', alignItems: 'center'}}
                  title="Delete Class"
                >
                   <Trash2 size={20} />
                </button>
              </div>
              
              <p style={{color:'#64748b', margin:0}}>{c.subjects?.length || 0} Subjects Configured</p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          textAlign: 'center',
          minHeight: '60vh'
        }}>
          <FolderOpen size={64} color="#cbd5e1" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#475569', margin: '0 0 10px 0' }}>No Classes Yet</h2>
          <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '400px' }}>
            Your dashboard is currently empty. Click the "+ Create New Class" button above to set up your first class and roster!
          </p>
        </div>
      )}

    </div>
  );
};

export default Dashboard;