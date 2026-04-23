import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Save, ArrowLeft, Calendar, BookOpen, AlertCircle, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast'; // Modern Popups
import api from '../api'; 

const Attendance = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState({}); 

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const studentRes = await api.get(`/classes/${classId}/students`);
        setStudents(studentRes.data);
        
        const initialStatus = {};
        studentRes.data.forEach(s => initialStatus[s.id] = 'P');
        setAttendanceRecords(initialStatus);

        const classRes = await api.get(`/classes`);
        const currentClass = classRes.data.find(c => c.id === classId);
        setClassData(currentClass); 

        setLoading(false);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load class data.");
        setLoading(false);
      }
    };
    fetchClassData();
  }, [classId]);

  const toggleStatus = (studentId) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: prev[studentId] === 'P' ? 'A' : 'P' }));
  };

  const handleRemoveStudent = async (studentId, studentName) => {
    // Keep window.confirm for dangerous deletions just to be safe
    if (window.confirm(`Are you sure you want to permanently remove ${studentName} from this class?`)) {
        try {
            await api.delete(`/classes/${classId}/students/${studentId}`);
            setStudents(students.filter(s => s.id !== studentId));
            toast.success(`${studentName} removed successfully.`);
        } catch (err) {
            console.error(err);
            toast.error("Error removing student. Check console.");
        }
    }
  };

  const saveAttendance = async () => {
    if (!subject) return toast.error("Please select a Subject.");
    
    try {
      await api.post('/attendance', { classId, date, subject, records: attendanceRecords });
      toast.success("Attendance saved successfully!");
      navigate('/'); 
    } catch (err) { 
      console.error(err);
      toast.error("Error saving attendance."); 
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Data...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <button onClick={() => navigate('/')} style={{background:'none', border:'none', cursor:'pointer', display:'flex', gap:'5px', color:'#64748b', fontWeight:'bold'}}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 style={{ margin: 0 }}>{classData?.className} - Mark Attendance</h1>
        
        {subject && (
          <button onClick={saveAttendance} className="btn-primary">
            <Save size={18} /> Save Records
          </button>
        )}
      </div>

      {/* Date & Subject Selectors */}
      <div className="card" style={{ marginBottom: '25px', display: 'flex', gap: '20px', padding: '20px' }}>
        <div style={{flex:1, display:'flex', flexDirection:'column', gap:'8px'}}>
          <label style={{fontSize:'0.85rem', fontWeight:'bold', color:'#64748b', display:'flex', alignItems:'center', gap:'5px'}}>
            <Calendar size={16}/> Date
          </label>
          <input type="date" className="input-style" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        
        <div style={{flex:1, display:'flex', flexDirection:'column', gap:'8px'}}>
          <label style={{fontSize:'0.85rem', fontWeight:'bold', color:'#64748b', display:'flex', alignItems:'center', gap:'5px'}}>
            <BookOpen size={16}/> Subject
          </label>
          <select className="input-style" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">-- Choose Subject to Mark Attendance --</option>
            {classData?.subjects?.map((sub, i) => (
               <option key={i} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Conditional Rendering */}
      {!subject ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <AlertCircle size={48} color="#cbd5e1" style={{ marginBottom: '15px' }} />
            <h2>Please select a Subject above</h2>
            <p>The student roster will appear once you choose the subject for this session.</p>
        </div>
      ) : (
        <div className="card" style={{padding: 0, overflow: 'hidden'}}>
          <table className="attendance-table">
            <thead>
              <tr>
                <th width="15%">Roll No</th>
                <th>Student Name</th>
                <th width="20%">Status</th>
                <th width="15%">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td><strong>{student.rollNo}</strong></td>
                  <td>{student.name}</td>
                  <td>
                    <button onClick={() => toggleStatus(student.id)} className={`status-btn ${attendanceRecords[student.id]}`}>
                      {attendanceRecords[student.id] === 'P' ? <><CheckCircle2 size={18} /> Present</> : <><XCircle size={18} /> Absent</>}
                    </button>
                  </td>
                  <td>
                    {/* Remove Student Button */}
                    <button 
                        onClick={() => handleRemoveStudent(student.id, student.name)}
                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', fontWeight: 'bold' }}
                    >
                        <UserMinus size={16} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
    </div>
  );
};

export default Attendance;