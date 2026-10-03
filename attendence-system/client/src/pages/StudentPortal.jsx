import React, { useState, useEffect } from 'react';
import { Calendar, FileSpreadsheet, Filter, FolderOpen, CheckCircle2, XCircle, Award, AlertTriangle, BookOpen, RefreshCw } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

const StudentPortal = ({ rollNo }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/student/my-attendance');
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to load attendance records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [rollNo]);

  // Extract unique classes and subjects
  const availableClasses = data?.classes || [];
  
  // Records filtered by class first
  const classFilteredRecords = (data?.attendanceRecords || []).filter(r => {
    if (!selectedClass) return true;
    return r.classId === selectedClass;
  });

  // Extract unique subjects from records
  const uniqueSubjects = [...new Set(classFilteredRecords.map(r => r.subject))];

  // Records filtered by both class and subject
  const displayedRecords = classFilteredRecords.filter(r => {
    if (!selectedSubject) return true;
    return r.subject === selectedSubject;
  });

  // Calculate filtered stats
  const totalCount = displayedRecords.length;
  const presentCount = displayedRecords.filter(r => r.status === 'P').length;
  const absentCount = displayedRecords.filter(r => r.status === 'A').length;
  const attendanceRate = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0;

  // CSV / Excel Export Engine for Student
  const exportAttendanceCSV = () => {
    if (displayedRecords.length === 0) {
      return toast.error("No attendance data to download!");
    }

    // Sort chronologically
    const sorted = [...displayedRecords].sort((a, b) => new Date(a.date) - new Date(b.date));

    const csvRows = [];
    csvRows.push(["STUDENT ATTENDANCE REPORT"]);
    csvRows.push([`Roll Number:`, data?.rollNo || rollNo]);
    csvRows.push([`Student Name:`, `"${data?.studentName || ''}"`]);
    csvRows.push([`Generated On:`, new Date().toLocaleDateString()]);
    csvRows.push([]); // blank line

    // Table Header
    csvRows.push(["Date", "Class", "Subject", "Status"]);

    // Table Data
    sorted.forEach(r => {
      csvRows.push([
        r.date,
        `"${r.className}"`,
        `"${r.subject}"`,
        r.status === 'P' ? 'Present' : 'Absent'
      ]);
    });

    // Summary Section at end
    csvRows.push([]);
    csvRows.push(["SUMMARY STATS"]);
    csvRows.push(["Total Sessions", totalCount]);
    csvRows.push(["Total Present", presentCount]);
    csvRows.push(["Total Absent", absentCount]);
    csvRows.push(["Attendance Percentage", `${attendanceRate}%`]);

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const fileName = `My_Attendance_Roll_${data?.rollNo || rollNo}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Attendance report downloaded successfully!");
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={32} className="spin-icon" style={{ animation: 'spin 1s linear infinite', marginBottom: '15px' }} />
        <h3>Loading your attendance records...</h3>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '20px' }}>
      
      {/* Welcome Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        color: 'white',
        padding: '24px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85 }}>
            Student Attendance Portal
          </span>
          <h1 style={{ margin: '5px 0', fontSize: '1.8rem', color: 'white' }}>
            {data?.studentName ? `Welcome, ${data.studentName}` : 'Welcome, Student'}
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '1rem' }}>
            Roll Number: <strong>{data?.rollNo || rollNo}</strong> • Enrolled in {availableClasses.length} {availableClasses.length === 1 ? 'Class' : 'Classes'}
          </p>
        </div>

        <button 
          onClick={exportAttendanceCSV} 
          className="btn-primary" 
          style={{ backgroundColor: '#10b981', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
        >
          <FileSpreadsheet size={18} /> Download My Attendance (CSV)
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '12px', color: '#2563eb' }}>
            <BookOpen size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Total Classes</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#1e293b' }}>{totalCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: '#dcfce7', padding: '12px', borderRadius: '12px', color: '#16a34a' }}>
            <CheckCircle2 size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Present</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#16a34a' }}>{presentCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '12px', color: '#dc2626' }}>
            <XCircle size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Absent</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#dc2626' }}>{absentCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ 
            background: Number(attendanceRate) >= 75 ? '#dcfce7' : '#fef3c7', 
            padding: '12px', 
            borderRadius: '12px', 
            color: Number(attendanceRate) >= 75 ? '#16a34a' : '#d97706' 
          }}>
            {Number(attendanceRate) >= 75 ? <Award size={28} /> : <AlertTriangle size={28} />}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Attendance Rate</div>
            <div style={{ 
              fontSize: '1.6rem', 
              fontWeight: 'bold', 
              color: Number(attendanceRate) >= 75 ? '#16a34a' : '#d97706' 
            }}>
              {attendanceRate}%
            </div>
          </div>
        </div>

      </div>

      {/* Filter and Content Card */}
      <div className="card">
        
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
          
          {/* Class Filter */}
          {availableClasses.length > 1 && (
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Filter size={15} /> Filter by Class
              </label>
              <select className="input-style" style={{ width: '100%' }} value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedSubject(''); }}>
                <option value="">All Classes</option>
                {availableClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.className}</option>
                ))}
              </select>
            </div>
          )}

          {/* Subject Filter */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <BookOpen size={15} /> Filter by Subject
            </label>
            <select className="input-style" style={{ width: '100%' }} value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="">All Subjects</option>
              {uniqueSubjects.map((sub, i) => (
                <option key={i} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div style={{ alignSelf: 'flex-end', marginLeft: 'auto' }}>
            <button 
              onClick={fetchAttendance} 
              className="btn-primary" 
              style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}
              title="Refresh attendance records"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

        </div>

        {/* Attendance Records Table */}
        {displayedRecords.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th style={{ textAlign: 'center' }}>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedRecords.map((r, i) => (
                  <tr key={r.id || i}>
                    <td style={{ fontWeight: '500' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} color="#64748b" /> {r.date}
                      </div>
                    </td>
                    <td>{r.className}</td>
                    <td>{r.subject}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          backgroundColor: r.status === 'P' ? '#dcfce7' : '#fee2e2',
                          color: r.status === 'P' ? '#166534' : '#991b1b'
                        }}
                      >
                        {r.status === 'P' ? (
                          <><CheckCircle2 size={16} /> Present</>
                        ) : (
                          <><XCircle size={16} /> Absent</>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
            <FolderOpen size={56} color="#cbd5e1" style={{ marginBottom: '15px' }} />
            <h3 style={{ color: '#475569', margin: '0 0 8px 0' }}>No Attendance Records Found</h3>
            <p style={{ margin: 0, maxWidth: '400px', marginInline: 'auto' }}>
              {selectedSubject 
                ? `No attendance has been recorded for subject "${selectedSubject}" yet.` 
                : "Your teacher has not recorded any attendance sessions for your enrolled classes yet."}
            </p>
          </div>
        )}

      </div>

    </div>
  );
};

export default StudentPortal;
