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
  }, [type, course, groupBy]);

  const courses = data?.courses || [];
  const courseGroups = data?.courseGroups || [];
  const feeBreakdown = data?.feeBreakdown || [];
  const heads = data?.heads || [];

  const groupedHeads = {};
  heads.forEach(h => { if (!groupedHeads[h.CATEGORY]) groupedHeads[h.CATEGORY] = []; groupedHeads[h.CATEGORY].push(h); });

  // Merge fee breakdown
  const mergedNrRow = { TOT_AMT: 0 };
  const mergedRRow = { TOT_AMT: 0 };
  let hasNr = false;
  let hasR = false;

  feeBreakdown.forEach(r => {
    const isNr = r.R_NR === 'N';
    const targetRow = isNr ? mergedNrRow : mergedRRow;
    if (isNr) hasNr = true;
    else hasR = true;

    heads.forEach(h => {
      if (r[h.HEAD_CODE]) {
        targetRow[h.HEAD_CODE] = (targetRow[h.HEAD_CODE] || 0) + parseFloat(r[h.HEAD_CODE]);
      }
    });
    if (r.TOT_AMT) {
      targetRow.TOT_AMT += parseFloat(r.TOT_AMT);
    }
  });

  let selectedEntityName = '';
  let selectedEntityCode = '';
  let selectedEntityFaculty = '';

  if (!course) {
    selectedEntityName = 'All Courses Merged';
    selectedEntityCode = 'ALL';
    selectedEntityFaculty = 'All Faculties';
  } else if (groupBy === 'course-group') {
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
    if (feeBreakdown.length === 0) return;

    const excelData = [];
    excelData.push([`Fee Structure: ${selectedEntityName} (${selectedEntityCode})`]);
    excelData.push([`Faculty: ${selectedEntityFaculty}`]);
    excelData.push([`Type: ${type === 'admission' ? 'Admission' : 'Continuation'} Fee`]);
    excelData.push([]);

    const headers = ['Head Code', 'Head of Account'];
    if (hasNr) headers.push('Non-Resident (₹)');
    if (hasR) headers.push('Resident (₹)');
    if (hasNr || hasR) headers.push('Total (₹)');
    excelData.push(headers);

    Object.entries(groupedHeads).forEach(([cat, catHeads]) => {
      excelData.push([`--- Category ${cat} ---`, '', '', '']);
      catHeads.forEach(h => {
        const nrVal = mergedNrRow[h.HEAD_CODE];
        const rVal = mergedRRow[h.HEAD_CODE];
        if (nrVal !== undefined || rVal !== undefined) {
          const row = [h.HEAD_CODE, h.HEAD_NAME || h.SHORT_HEAD_NAME];
          const nrNum = nrVal && parseFloat(nrVal) > 0 ? parseFloat(nrVal) : 0;
          const rNum = rVal && parseFloat(rVal) > 0 ? parseFloat(rVal) : 0;
          
          if (hasNr) row.push(nrNum);
          if (hasR) row.push(rNum);
          if (hasNr || hasR) row.push(nrNum + rNum);
          
          excelData.push(row);
        }
      });
    });

    excelData.push([]);
    const totalRow = ['TOTAL', ''];
    if (hasNr) totalRow.push(mergedNrRow.TOT_AMT);
    if (hasR) totalRow.push(mergedRRow.TOT_AMT);
    if (hasNr || hasR) totalRow.push((mergedNrRow.TOT_AMT || 0) + (mergedRRow.TOT_AMT || 0));
    excelData.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Merged Fee Structure");
    XLSX.writeFile(wb, `${selectedEntityCode}_${type}_Merged_Fee.xlsx`);
  };

  const printReport = () => {
    window.print();
  };

  const faculties = [...new Set(courses.map(c => c.FACNAME || c.FACULTY).filter(Boolean))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <div className="page-header" style={{ flexShrink: 0, '@media print': {display: 'none'} }}>
        <h1>Head-wise Breakdown</h1>
        <p>Generate a printable chart or Excel export for a specific course, faculty, group, or all courses merged</p>
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

          {feeBreakdown.length > 0 && (
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
      {feeBreakdown.length > 0 && (
        <div className="glass-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding:'var(--space-5)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div className="print-visible" style={{display:'none', textAlign:'center', marginBottom:'1rem'}}>
              <h2>Aligarh Muslim University</h2>
              <h3>Student Section Fee Management</h3>
              <h4>{type === 'admission' ? 'Admission' : 'Continuation'} Fee Structure</h4>
              <p><strong>{selectedEntityName}</strong></p>
              <p><strong>Faculty:</strong> {selectedEntityFaculty}</p>
            </div>
            
            <h3 style={{marginBottom:'1rem', flexShrink: 0, color:'var(--text-secondary)'}} className="hide-on-print">
              {selectedEntityName}
            </h3>

            <div className="table-container" style={{border:'none', flex: 1, overflow: 'auto'}}>
              <table className="data-table" style={{fontSize:'var(--text-xs)'}}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 50 }}>
                  <tr style={{background:'var(--bg-base)'}}>
                    <th style={{minWidth:'200px', position: 'sticky', top: 0, zIndex: 50}}>Head of Account</th>
                    <th style={{position: 'sticky', top: 0, zIndex: 50}}>Code</th>
                    {hasNr && <th style={{textAlign:'center',background:'var(--accent-blue-dim)',color:'var(--accent-blue-soft)', position: 'sticky', top: 0, zIndex: 50}}>NON-RESIDENT</th>}
                    {hasR && <th style={{textAlign:'center',background:'var(--accent-emerald-dim)',color:'var(--accent-emerald-soft)', position: 'sticky', top: 0, zIndex: 50}}>RESIDENT</th>}
                    {(hasNr || hasR) && <th style={{textAlign:'center',background:'var(--accent-purple-dim)',color:'var(--accent-purple-soft)', position: 'sticky', top: 0, zIndex: 50}}>TOTAL (NR + R)</th>}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedHeads).map(([cat, catHeads]) => {
                    let hasHeads = false;
                    const rows = catHeads.map(h => {
                      const nrVal = mergedNrRow[h.HEAD_CODE];
                      const rVal = mergedRRow[h.HEAD_CODE];
                      if (nrVal === undefined && rVal === undefined) return null;
                      hasHeads = true;
                      
                      const nrNum = nrVal && parseFloat(nrVal) > 0 ? parseFloat(nrVal) : 0;
                      const rNum = rVal && parseFloat(rVal) > 0 ? parseFloat(rVal) : 0;
                      const totalNum = nrNum + rNum;
                      
                      return (
                        <tr key={h.HEAD_CODE}>
                          <td style={{fontWeight:500}}>{h.SHORT_HEAD_NAME || h.HEAD_NAME}</td>
                          <td><code style={{fontSize:'var(--text-xs)',background:'var(--bg-hover)',padding:'1px 6px',borderRadius:'3px'}}>{h.HEAD_CODE}</code></td>
                          {hasNr && <td style={{textAlign:'right',fontWeight:500}}>{nrNum > 0 ? formatCurrency(nrNum) : '—'}</td>}
                          {hasR && <td style={{textAlign:'right',fontWeight:500}}>{rNum > 0 ? formatCurrency(rNum) : '—'}</td>}
                          {(hasNr || hasR) && <td style={{textAlign:'right',fontWeight:700,color:'var(--accent-purple-soft)'}}>{totalNum > 0 ? formatCurrency(totalNum) : '—'}</td>}
                        </tr>
                      );
                    });

                    if (!hasHeads) return null;

                    return (
                      <React.Fragment key={cat}>
                        <tr style={{background:CAT_COLORS[cat]?.bg}}>
                          <td colSpan={2 + (hasNr ? 1 : 0) + (hasR ? 1 : 0) + ((hasNr || hasR) ? 1 : 0)} style={{fontWeight:700,color:CAT_COLORS[cat]?.text,padding:'var(--space-3) var(--space-4)'}}>
                            Category {cat} — {CAT_COLORS[cat]?.label}
                          </td>
                        </tr>
                        {rows}
                      </React.Fragment>
                    );
                  })}
                  <tr style={{background:'var(--bg-elevated)',fontWeight:700,fontSize:'var(--text-sm)'}}>
                    <td colSpan={2} style={{fontWeight:800}}>GRAND TOTAL</td>
                    {hasNr && <td style={{textAlign:'right',color:'var(--accent-blue-soft)'}}>{formatCurrency(mergedNrRow.TOT_AMT)}</td>}
                    {hasR && <td style={{textAlign:'right',color:'var(--accent-emerald-soft)'}}>{formatCurrency(mergedRRow.TOT_AMT)}</td>}
                    {(hasNr || hasR) && <td style={{textAlign:'right',color:'var(--accent-purple-soft)'}}>{formatCurrency((mergedNrRow.TOT_AMT || 0) + (mergedRRow.TOT_AMT || 0))}</td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {feeBreakdown.length === 0 && !loading && (
        <div className="glass-card" style={{padding:'var(--space-8)',textAlign:'center'}}>
          <div style={{fontSize:'3rem',marginBottom:'var(--space-3)'}}>📭</div>
          <p style={{color:'var(--text-secondary)'}}>No fee structure found for the selected criteria</p>
        </div>
      )}
      
      <style jsx global>{`
        @media print {
          html, body {
            height: auto !important;
            overflow: visible !important;
          }
          .print-visible[style*="display: none"] {
            display: block !important;
          }
          .hide-on-print {
            display: none !important;
          }
          .glass-card > div.filter-bar {
            display: none !important;
          }
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
