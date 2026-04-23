import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const ClassWizard = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ className: '', totalStudents: '', totalSubjects: '' });
  const [studentNames, setStudentNames] = useState([]);
  const [subjectNames, setSubjectNames] = useState([]);
  const navigate = useNavigate();

  // Go to Step 2
  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!formData.className || formData.totalStudents <= 0 || formData.totalSubjects <= 0) {
        return alert("Please fill details correctly");
    }
    setStudentNames(Array(parseInt(formData.totalStudents)).fill(""));
    setSubjectNames(Array(parseInt(formData.totalSubjects)).fill(""));
    setStep(2);
  };

  // Go to Step 3
  const handleStep2Submit = () => {
    if (studentNames.some(n => n.trim() === "")) return alert("All student names are required!");
    setStep(3);
  };

  // Final Submit to Backend
  const submitFinal = async () => {
    if (subjectNames.some(n => n.trim() === "")) return alert("All subject names are required!");
    
    try {
      await api.post('/classes', {
        className: formData.className,
        subjects: subjectNames,
        students: studentNames
      });
      navigate('/');
    } catch (err) { 
        console.error(err);
        alert("Server Error. Check console."); 
    }
  };

  return (
    <div className="card wizard-card">
      {/* STEP 1: Basic Info */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ color: '#1e293b', margin: 0 }}>Create New Class</h2>
          <p style={{ color: '#64748b', margin: '-10px 0 10px 0' }}>Step 1: Basic Information</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#475569' }}>Class Name</label>
              <input type="text" className="input-style" placeholder="e.g. 10th Section B" onChange={e => setFormData({...formData, className: e.target.value})} required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#475569' }}>Number of Students</label>
              <input type="number" className="input-style" placeholder="e.g. 40" min="1" onChange={e => setFormData({...formData, totalStudents: e.target.value})} required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#475569' }}>Number of Subjects</label>
              <input type="number" className="input-style" placeholder="e.g. 5" min="1" onChange={e => setFormData({...formData, totalSubjects: e.target.value})} required />
          </div>

          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
              Next: Enter Student Names
          </button>
        </form>
      )}

      {/* STEP 2: Students */}
      {step === 2 && (
        <div>
          <h2 style={{ color: '#1e293b', margin: '0 0 5px 0' }}>Student Names</h2>
          <p style={{ color: '#64748b', marginBottom: '25px' }}>Step 2: Enter the names for all {formData.totalStudents} students.</p>
          
          <div className="student-grid">
            {studentNames.map((name, i) => (
              <input 
                key={i} type="text" className="input-style" placeholder={`Roll No ${i+1}`} value={name}
                onChange={e => {
                  let updated = [...studentNames];
                  updated[i] = e.target.value;
                  setStudentNames(updated);
                }}
              />
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
              <button onClick={() => setStep(1)} className="btn-secondary" style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Back</button>
              <button onClick={handleStep2Submit} className="btn-primary">Next: Enter Subjects</button>
          </div>
        </div>
      )}

      {/* STEP 3: Subjects */}
      {step === 3 && (
        <div>
          <h2 style={{ color: '#1e293b', margin: '0 0 5px 0' }}>Subject Names</h2>
          <p style={{ color: '#64748b', marginBottom: '25px' }}>Step 3: Enter the names of the {formData.totalSubjects} subjects.</p>
          
          <div className="student-grid">
            {subjectNames.map((name, i) => (
              <input 
                key={i} type="text" className="input-style" placeholder={`Subject ${i+1}`} value={name}
                onChange={e => {
                  let updated = [...subjectNames];
                  updated[i] = e.target.value;
                  setSubjectNames(updated);
                }}
              />
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
              <button onClick={() => setStep(2)} className="btn-secondary" style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Back</button>
              <button onClick={submitFinal} className="btn-primary">Complete Class Creation</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassWizard;