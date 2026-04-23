import React, { useState, useEffect } from 'react';
import api from '../api';
import { Calendar, Users, FileSpreadsheet, Filter, FolderOpen } from 'lucide-react';

const Reports = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  
  // Data States
  const [reports, setReports] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');

  // 1. Fetch the list of classes on load
  useEffect(() => {
    api.get('/classes')
       .then(res => setClasses(res.data))
       .catch(err => console.error(err));
  }, []);

  // 2. Fetch Reports AND Students when a class is selected
  const fetchReports = async (classId) => {
    setSelectedClass(classId);
    setSelectedSubject(''); // Reset subject filter when class changes
    
    if (!classId) {
      setReports([]);
      setStudents([]);
      return;
    }
    
    try {
      // Fetch both simultaneously to speed up loading
      const [reportsRes, studentsRes] = await Promise.all([
         api.get(`/classes/${classId}/reports`),
         api.get(`/classes/${classId}/students`)
      ]);
      setReports(reportsRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  // 3. Extract unique subjects from the fetched reports for the Dropdown
  const uniqueSubjects = [...new Set(reports.map(r => r.subject))];

  // 4. Filter reports based on the dropdown selection
  const filteredReports = selectedSubject
    ? reports.filter(r => r.subject === selectedSubject)
    : reports;

  // 5. The CSV / Excel Generator Engine
  const exportToExcel = () => {
    if (!filteredReports.length) return alert("No data to export!");

    // Sort reports chronologically (oldest to newest) for left-to-right columns
    const sortedReports = [...filteredReports].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Create the Header Row
    const headers = ["Roll No", "Student Name"];
    sortedReports.forEach(r => headers.push(`${r.date} (${r.subject})`));
    headers.push("Total Present", "Total Absent");

    // Create the Data Rows (One row per student)
    const csvRows = [];
    csvRows.push(headers.join(",")); 

    students.forEach(student => {
        let presentCount = 0;
        let absentCount = 0;

        // Start row with Roll No and Name (Quotes around name prevent comma breaks)
        const rowData = [student.rollNo, `"${student.name}"`]; 

        // Check the student's status for every single date
        sortedReports.forEach(report => {
            const status = report.records[student.id] || '-';
            if (status === 'P') presentCount++;
            if (status === 'A') absentCount++;
            rowData.push(status);
        });

        // Add totals at the end of the row
        rowData.push(presentCount, absentCount);
        csvRows.push(rowData.join(","));
    });

    // Convert to a downloadable CSV file
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    // Set the file name dynamically
    const fileName = selectedSubject 
        ? `Attendance_${selectedSubject.replace(/\s+/g, '_')}.csv` 
        : `Attendance_All_Subjects.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100%' }}>
      
      <h1 style={{ color: '#1e293b', margin: '0 0 20px 0' }}>Attendance Reports</h1>
      
      {/* Top Class Selector Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <label style={{fontSize:'0.85rem', fontWeight:'bold', color:'#64748b', display:'flex', marginBottom:'8px'}}>
           Select Class Roster
        </label>
        <select className="input-style" onChange={(e) => fetchReports(e.target.value)}>
          <option value="">-- Choose a Class --</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
        </select>
      </div>

      {/* Main Content Area */}
      {selectedClass ? (
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* Action Bar: Filters & Download */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            
            <div style={{ flex: 1, minWidth: '250px' }}>
              <label style={{fontSize:'0.85rem', fontWeight:'bold', color:'#64748b', display:'flex', alignItems: 'center', gap: '5px', marginBottom:'8px'}}>
                 <Filter size={16}/> Filter by Subject
              </label>
              <select className="input-style" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                <option value="">All Subjects</option>
                {uniqueSubjects.map((sub, i) => (
                   <option key={i} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <button onClick={exportToExcel} className="btn-primary" style={{ backgroundColor: '#10b981', color: 'white' }}>
              <FileSpreadsheet size={18} /> Download Excel (CSV)
            </button>
          </div>

          {/* History Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Total Present</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report, i) => {
                  const totalPresent = Object.values(report.records).filter(status => status === 'P').length;
                  return (
                    <tr key={i}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                          <Calendar size={16} color="#64748b"/> {report.date}
                      </td>
                      <td>{report.subject}</td>
                      <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 'bold' }}>
                              <Users size={16}/> {totalPresent} Students
                          </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredReports.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No attendance records found for this selection.
                </div>
            )}
          </div>

        </div>
      ) : (
        /* Empty State */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '50vh' }}>
          <FolderOpen size={64} color="#cbd5e1" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#475569', margin: '0 0 10px 0' }}>Select a class</h2>
          <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '400px' }}>
            Pick a class from the dropdown above to view its attendance history and export spreadsheets.
          </p>
        </div>
      )}
    </div>
  );
};

export default Reports;