'use client';
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import * as XLSX from 'xlsx';

const CAT_COLORS = { A: { bg: 'var(--accent-blue-dim)', text: 'var(--accent-blue-soft)', label: 'University Fee' }, B: { bg: 'var(--accent-emerald-dim)', text: 'var(--accent-emerald-soft)', label: 'Union & Activities' }, C: { bg: 'var(--accent-amber-dim)', text: 'var(--accent-amber-soft)', label: 'Hall Fees' }, D: { bg: 'var(--accent-purple-dim)', text: 'var(--accent-purple-soft)', label: 'Refundable Deposits' } };

export default function PrintHeadWiseReport() {
  const [type, setType] = useState('admission');
  const [groupBy, setGroupBy] = useState('course'); // 'course' | 'faculty' | 'course-group'
  const [course, setCourse] = useState(''); // can be CLASSCODE, FACULTY_NAME, or GROUP_id
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let url = `/api/reports/head-wise?type=${type}`;
    if (course) {
      if (groupBy === 'course-group') {
        const group = data?.courseGroups?.find(g => g.id.toString() === course);
        if (group && group.courses.length > 0) {
          url += `&groupCourses=${group.courses.join(',')}`;
        } else {
          url += `&course=unknown`;
        }
      } else if (groupBy === 'faculty') {
        // Find all courses in this faculty
        const facCourses = data?.courses?.filter(c => c.FACULTY === course || c.FACNAME === course).map(c => c.CLASSCODE) || [];
        if (facCourses.length > 0) {
          url += `&groupCourses=${facCourses.join(',')}`;
        } else {
          url += `&course=unknown`;
        }
      } else {
        url += `&course=${course}`;
      }
    }

    fetch(url)
      .then(r => r.json()).then(d => { 
        setData(prev => ({ ...d, courseGroups: d.courseGroups || prev?.courseGroups })); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, [type, course, groupBy]); // Note: data dependency omitted to prevent infinite loop

  const courses = data?.courses || [];
  const courseGroups = data?.courseGroups || [];
  const feeBreakdown = data?.feeBreakdown || [];
  const heads = data?.heads || [];

  const grouped = {};
  heads.forEach(h => { if (!grouped[h.CATEGORY]) grouped[h.CATEGORY] = []; grouped[h.CATEGORY].push(h); });

  const nrRows = feeBreakdown.filter(r => r.R_NR === 'N');
  const rRows = feeBreakdown.filter(r => r.R_NR === 'R');
  
  let selectedEntityName = '';
  let selectedEntityCode = '';
  let selectedEntityFaculty = '';

  if (groupBy === 'course-group') {
    const group = courseGroups.find(g => g.id.toString() === course);
    selectedEntityName = group?.group_name || 'Course Group';
    selectedEntityCode = 'Group';
    selectedEntityFaculty = 'Multiple Faculties';
  } else if (groupBy === 'faculty') {
    selectedEntityName = course || 'Faculty';
    selectedEntityCode = 'Faculty';
    selectedEntityFaculty = course;
  } else {
    const selectedCourse = courses.find(c => c.CLASSCODE === course);
    selectedEntityName = selectedCourse?.CLASS || 'Course';
    selectedEntityCode = selectedCourse?.CLASSCODE || '';
    selectedEntityFaculty = selectedCourse?.FACNAME || '';
  }

  const exportToExcel = () => {
    if (!course || feeBreakdown.length === 0) return;

    const excelData = [];
    excelData.push([`Fee Structure: ${selectedEntityName} (${selectedEntityCode})`]);
    excelData.push([`Faculty: ${selectedEntityFaculty}`]);
    excelData.push([`Type: ${type === 'admission' ? 'Admission' : 'Continuation'} Fee`]);
    excelData.push([]);

    const headers = ['Head Code', 'Head of Account'];
    if (nrRows.length > 0) headers.push('Non-Resident (₹)');
    if (rRows.length > 0) headers.push('Resident (₹)');
    excelData.push(headers);

    Object.entries(grouped).forEach(([cat, catHeads]) => {
      excelData.push([`--- Category ${cat} ---`, '', '', '']);
      catHeads.forEach(h => {
        const nrVal = nrRows[0]?.[h.HEAD_CODE];
        const rVal = rRows[0]?.[h.HEAD_CODE];
        if (nrVal !== undefined || rVal !== undefined) {
          const row = [h.HEAD_CODE, h.HEAD_NAME || h.SHORT_HEAD_NAME];
          if (nrRows.length > 0) row.push(nrVal && parseFloat(nrVal) > 0 ? parseFloat(nrVal) : 0);
          if (rRows.length > 0) row.push(rVal && parseFloat(rVal) > 0 ? parseFloat(rVal) : 0);
          excelData.push(row);
        }
      });
    });

    excelData.push([]);
    const totalRow = ['TOTAL', ''];
    if (nrRows.length > 0) totalRow.push(parseFloat(nrRows[0]?.TOT_AMT || 0));
    if (rRows.length > 0) totalRow.push(parseFloat(rRows[0]?.TOT_AMT || 0));
    excelData.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fee Structure");
    XLSX.writeFile(wb, `${selectedEntityCode}_${type}_Fee_Structure.xlsx`);
  };

  const printReport = () => {
    window.print();
  };

  // Get unique faculties
  const faculties = [...new Set(courses.map(c => c.FACNAME || c.FACULTY).filter(Boolean))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* Non-printable header and controls */}
      <div className="print-visible" style={{display:'none', textAlign:'center', marginBottom:'2rem'}}>
        <h2>Aligarh Muslim University</h2>
        <h3>Student Section Fee Management</h3>
        <h4>{type === 'admission' ? 'Admission' : 'Continuation'} Fee Structure</h4>
        <p><strong></strong> {selectedEntityName} {selectedEntityCode !== 'Faculty' && selectedEntityCode !== 'Group' ? `(${selectedEntityCode})` : ''}</p>
        <p><strong>Faculty:</strong> {selectedEntityFaculty}</p>
      </div>

      <div className="page-header" style={{ flexShrink: 0, '@media print': {display: 'none'} }}>
        <h1>Head-wise Breakdown</h1>
        <p>Generate a printable chart or Excel export for a specific course, faculty, or group fee structure</p>
      </div>

      <div className="glass-card" style={{padding:'var(--space-4)',marginBottom:'var(--space-5)', flexShrink: 0, '@media print': {display: 'none'} }}>
        <div className="filter-bar" style={{flexWrap: 'wrap'}}>
          <div style={{display:'flex',gap:'2px',background:'var(--bg-input)',borderRadius:'var(--radius-md)',padding:'2px'}}>
            <button onClick={() => { setType('admission'); setCourse(''); }} style={{padding:'var(--space-2) var(--space-5)',borderRadius:'var(--radius-md)',border:'none',cursor:'pointer',fontWeight:600,fontSize:'var(--text-sm)',background: type==='admission' ? 'var(--accent-blue)' : 'transparent', color: type==='admission' ? 'white' : 'var(--text-secondary)'}}>Admission</button>
            <button onClick={() => { setType('continuation'); setCourse(''); }} style={{padding:'var(--space-2) var(--space-5)',borderRadius:'var(--radius-md)',border:'none',cursor:'pointer',fontWeight:600,fontSize:'var(--text-sm)',background: type==='continuation' ? 'var(--accent-emerald)' : 'transparent', color: type==='continuation' ? 'white' : 'var(--text-secondary)'}}>Continuation</button>
          </div>
          
          <select className="form-select" style={{maxWidth:'200px'}} value={groupBy} onChange={e => { setGroupBy(e.target.value); setCourse(''); }}>
            <option value="course">Course-wise</option>
            <option value="faculty">Faculty-wise</option>
            <option value="course-group">Course Group-wise</option>
          </select>

          <select className="form-select" style={{maxWidth:'300px'}} value={course} onChange={e => setCourse(e.target.value)}>
            <option value="">— Select {groupBy === 'course' ? 'Course' : groupBy === 'faculty' ? 'Faculty' : 'Course Group'} —</option>
            {groupBy === 'course-group' && courseGroups.map(g => (
              <option key={g.id} value={g.id.toString()}>{g.group_name} ({g.courses.length} courses)</option>
            ))}
            {groupBy === 'faculty' && faculties.map(fac => (
              <option key={fac} value={fac}>{fac}</option>
            ))}
            {groupBy === 'course' && courses.map(c => (
              <option key={c.CLASSCODE} value={c.CLASSCODE}>{c.CLASS} ({c.CLASSCODE})</option>
            ))}
          </select>

          {course && feeBreakdown.length > 0 && (
            <div style={{display:'flex',gap:'var(--space-2)',marginLeft:'auto'}}>
              <button className="btn btn-export print-visible" onClick={exportToExcel}>
                <span style={{marginRight:'8px'}}>📊</span> Export Excel
              </button>
              <button className="btn btn-primary print-visible" onClick={printReport}>
                <span style={{marginRight:'8px'}}>🖨️</span> Print PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Report Preview */}
      {course && feeBreakdown.length > 0 && (
        <div className="glass-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding:'var(--space-5)', overflow: 'hidden' }}>
          <div className="table-container" style={{border:'none', flex: 1, overflow: 'auto'}}>
            <table className="data-table" style={{fontSize:'var(--text-xs)'}}>
              <thead>
                <tr style={{background:'var(--bg-base)'}}>
                  <th style={{minWidth:'200px'}}>Head of Account</th>
                  <th>Code</th>
                  {nrRows.length > 0 && <th style={{textAlign:'center',background:'var(--accent-blue-dim)',color:'var(--accent-blue-soft)'}}>NON-RESIDENT</th>}
                  {rRows.length > 0 && <th style={{textAlign:'center',background:'var(--accent-emerald-dim)',color:'var(--accent-emerald-soft)'}}>RESIDENT</th>}
                </tr>
              </thead>
              <tbody>
                {Object.entries(grouped).map(([cat, catHeads]) => (
                  <React.Fragment key={cat}>
                    <tr style={{background:CAT_COLORS[cat]?.bg}}>
                      <td colSpan={2 + (nrRows.length > 0 ? 1 : 0) + (rRows.length > 0 ? 1 : 0)} style={{fontWeight:700,color:CAT_COLORS[cat]?.text,padding:'var(--space-3) var(--space-4)'}}>
                        Category {cat} — {CAT_COLORS[cat]?.label}
                      </td>
                    </tr>
                    {catHeads.map(h => {
                      const nrVal = nrRows[0]?.[h.HEAD_CODE];
                      const rVal = rRows[0]?.[h.HEAD_CODE];
                      if (nrVal === undefined && rVal === undefined) return null;
                      return (
                        <tr key={h.HEAD_CODE}>
                          <td style={{fontWeight:500}}>{h.SHORT_HEAD_NAME || h.HEAD_NAME}</td>
                          <td><code style={{fontSize:'var(--text-xs)',background:'var(--bg-hover)',padding:'1px 6px',borderRadius:'3px'}}>{h.HEAD_CODE}</code></td>
                          {nrRows.length > 0 && <td style={{textAlign:'right',fontWeight:500}}>{nrVal && parseFloat(nrVal) > 0 ? formatCurrency(nrVal) : nrVal === '0.00' ? '—' : '—'}</td>}
                          {rRows.length > 0 && <td style={{textAlign:'right',fontWeight:500}}>{rVal && parseFloat(rVal) > 0 ? formatCurrency(rVal) : rVal === '0.00' ? '—' : '—'}</td>}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
                <tr style={{background:'var(--bg-elevated)',fontWeight:700,fontSize:'var(--text-sm)'}}>
                  <td colSpan={2} style={{fontWeight:800}}>TOTAL</td>
                  {nrRows.length > 0 && <td style={{textAlign:'right',color:'var(--accent-blue-soft)'}}>{formatCurrency(nrRows[0]?.TOT_AMT)}</td>}
                  {rRows.length > 0 && <td style={{textAlign:'right',color:'var(--accent-emerald-soft)'}}>{formatCurrency(rRows[0]?.TOT_AMT)}</td>}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {course && feeBreakdown.length === 0 && !loading && (
        <div className="glass-card" style={{padding:'var(--space-8)',textAlign:'center'}}>
          <div style={{fontSize:'3rem',marginBottom:'var(--space-3)'}}>📭</div>
          <p style={{color:'var(--text-secondary)'}}>No fee structure found for this course</p>
        </div>
      )}
      
      {/* Global styles injection specifically to support print view tweaks inside this component if needed */}
      <style jsx global>{`
        @media print {
          html, body {
            height: auto !important;
            overflow: visible !important;
          }
          .print-visible[style*="display: none"] {
            display: block !important;
          }
          .glass-card > div.filter-bar {
            display: none !important;
          }
          /* Allow table to break across pages */
          div[style*="height: calc"] {
            height: auto !important;
            display: block !important;
          }
          .glass-card, .table-container {
            height: auto !important;
            overflow: visible !important;
            display: block !important;
            flex: none !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
        }
      `}</style>
    </div>
  );
}
