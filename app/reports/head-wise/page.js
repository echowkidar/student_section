'use client';
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

const CAT_COLORS = { A: { bg: 'var(--accent-blue-dim)', text: 'var(--accent-blue-soft)', label: 'University Fee' }, B: { bg: 'var(--accent-emerald-dim)', text: 'var(--accent-emerald-soft)', label: 'Union & Activities' }, C: { bg: 'var(--accent-amber-dim)', text: 'var(--accent-amber-soft)', label: 'Hall Fees' }, D: { bg: 'var(--accent-purple-dim)', text: 'var(--accent-purple-soft)', label: 'Refundable Deposits' } };

export default function HeadWiseReports() {
  const [type, setType] = useState('admission');
  const [course, setCourse] = useState('');
  const [data, setData] = useState(null);
  const [courseGroups, setCourseGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/course-groups')
      .then(r => r.json())
      .then(d => setCourseGroups(d))
      .catch(console.error);
  }, []);

  // Filter courses based on selected group
  const groupObj = courseGroups.find(g => g.id.toString() === selectedGroup);

  useEffect(() => {
    setLoading(true);
    let groupCoursesParam = '';
    if (selectedGroup && !course && groupObj) {
      groupCoursesParam = `&groupCourses=${groupObj.courses.join(',')}`;
    }
    fetch(`/api/reports/head-wise?type=${type}&course=${course}${groupCoursesParam}`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [type, course, selectedGroup, courseGroups]);

  const heads = data?.heads || [];
  const courses = data?.courses || [];
  const feeBreakdown = data?.feeBreakdown || [];

  const filteredCourses = groupObj 
    ? courses.filter(c => groupObj.courses.includes(c.CLASSCODE))
    : courses;

  // Group heads by category
  const grouped = {};
  heads.forEach(h => { if (!grouped[h.CATEGORY]) grouped[h.CATEGORY] = []; grouped[h.CATEGORY].push(h); });

  // Group fee breakdown by course
  const feeBreakdownByCourse = {};
  feeBreakdown.forEach(row => {
    if (!feeBreakdownByCourse[row.CLASSCODE]) {
      feeBreakdownByCourse[row.CLASSCODE] = [];
    }
    feeBreakdownByCourse[row.CLASSCODE].push(row);
  });
  const coursesToRender = Object.keys(feeBreakdownByCourse);

  return (
    <div>
      <div className="page-header">
        <h1>📑 Head of Account Wise Reports</h1>
        <p>Fee distribution across all heads of account by course</p>
      </div>

      {/* Controls */}
      <div className="glass-card" style={{padding:'var(--space-4)',marginBottom:'var(--space-5)'}}>
        <div className="filter-bar">
          <div style={{display:'flex',gap:'2px',background:'var(--bg-input)',borderRadius:'var(--radius-md)',padding:'2px'}}>
            <button onClick={() => { setType('admission'); setCourse(''); }} style={{padding:'var(--space-2) var(--space-5)',borderRadius:'var(--radius-md)',border:'none',cursor:'pointer',fontWeight:600,fontSize:'var(--text-sm)',background: type==='admission' ? 'var(--accent-blue)' : 'transparent', color: type==='admission' ? 'white' : 'var(--text-secondary)'}}>Admission</button>
            <button onClick={() => { setType('continuation'); setCourse(''); }} style={{padding:'var(--space-2) var(--space-5)',borderRadius:'var(--radius-md)',border:'none',cursor:'pointer',fontWeight:600,fontSize:'var(--text-sm)',background: type==='continuation' ? 'var(--accent-emerald)' : 'transparent', color: type==='continuation' ? 'white' : 'var(--text-secondary)'}}>Continuation</button>
          </div>
          <select className="form-select" style={{maxWidth:'250px'}} value={selectedGroup} onChange={e => { setSelectedGroup(e.target.value); setCourse(''); }}>
            <option value="">— All Course Groups —</option>
            {courseGroups.map(g => <option key={g.id} value={g.id}>{g.group_name}</option>)}
          </select>
          <select className="form-select" style={{maxWidth:'350px'}} value={course} onChange={e => setCourse(e.target.value)}>
            <option value="">— Select Course —</option>
            {filteredCourses.map(c => <option key={c.CLASSCODE} value={c.CLASSCODE}>{c.CLASS} ({c.CLASSCODE})</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards when no course and no group selected */}
      {!course && !selectedGroup && (
        <>
          <div className="stats-grid" style={{marginBottom:'var(--space-5)'}}>
            <div className="glass-card stat-card blue"><div className="stat-card-icon blue">📋</div><div className="stat-card-value">{heads.length}</div><div className="stat-card-title">Total Heads</div></div>
            <div className="glass-card stat-card emerald"><div className="stat-card-icon emerald">📁</div><div className="stat-card-value">4</div><div className="stat-card-title">Categories</div></div>
            <div className="glass-card stat-card amber"><div className="stat-card-icon amber">🎓</div><div className="stat-card-value">{courses.length}</div><div className="stat-card-title">{type === 'admission' ? 'Admission' : 'Continuation'} Courses</div></div>
            <div className="glass-card stat-card purple"><div className="stat-card-icon purple">📊</div><div className="stat-card-value">{type === 'admission' ? '4,303' : '979'}</div><div className="stat-card-title">Fee Combinations</div></div>
          </div>

          {/* All Heads Table */}
          <div className="glass-card">
            <div style={{padding:'var(--space-5) var(--space-5) 0'}}><h4>All Heads of Account</h4></div>
            <div className="table-container" style={{border:'none'}}>
              <table className="data-table">
                <thead><tr><th>Head Code</th><th>Head Name</th><th>Short Name</th><th>Category</th></tr></thead>
                <tbody>
                  {heads.map(h => (
                    <tr key={h.HEAD_CODE}>
                      <td><code style={{fontSize:'var(--text-xs)',background:'var(--bg-hover)',padding:'2px 8px',borderRadius:'4px'}}>{h.HEAD_CODE}</code></td>
                      <td style={{fontWeight:500}}>{h.HEAD_NAME}</td>
                      <td style={{color:'var(--text-secondary)'}}>{h.SHORT_HEAD_NAME}</td>
                      <td><span style={{padding:'2px 10px',borderRadius:'var(--radius-full)',fontSize:'var(--text-xs)',fontWeight:600,background:CAT_COLORS[h.CATEGORY]?.bg,color:CAT_COLORS[h.CATEGORY]?.text}}>{h.CATEGORY} — {CAT_COLORS[h.CATEGORY]?.label}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Fee Breakdown Tables for Selected Course or Group */}
      {(course || selectedGroup) && feeBreakdown.length > 0 && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-5)'}}>
          {coursesToRender.map(courseCode => {
            const currentCourse = courses.find(c => c.CLASSCODE === courseCode);
            const courseRows = feeBreakdownByCourse[courseCode];
            const nrRows = courseRows.filter(r => r.R_NR === 'N');
            const rRows = courseRows.filter(r => r.R_NR === 'R');
            
            return (
              <div key={courseCode} className="glass-card" style={{overflow:'auto'}}>
                <div style={{padding:'var(--space-5)'}}>
                  <h3 style={{marginBottom:'var(--space-1)'}}>{currentCourse?.CLASS || courseCode}</h3>
                  <p style={{color:'var(--text-tertiary)',fontSize:'var(--text-sm)'}}>{currentCourse?.FACNAME} — {type === 'admission' ? 'Admission' : 'Continuation'} Fee Structure</p>
                </div>
                <div className="table-container" style={{border:'none'}}>
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
                      {/* Total Row */}
                      <tr style={{background:'var(--bg-elevated)',fontWeight:700,fontSize:'var(--text-sm)'}}>
                        <td colSpan={2} style={{fontWeight:800}}>TOTAL</td>
                        {nrRows.length > 0 && <td style={{textAlign:'right',color:'var(--accent-blue-soft)'}}>{formatCurrency(nrRows[0]?.TOT_AMT)}</td>}
                        {rRows.length > 0 && <td style={{textAlign:'right',color:'var(--accent-emerald-soft)'}}>{formatCurrency(rRows[0]?.TOT_AMT)}</td>}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(course || selectedGroup) && feeBreakdown.length === 0 && !loading && (
        <div className="glass-card" style={{padding:'var(--space-8)',textAlign:'center'}}>
          <div style={{fontSize:'3rem',marginBottom:'var(--space-3)'}}>📭</div>
          <p style={{color:'var(--text-secondary)'}}>No fee structure found for this course</p>
        </div>
      )}
    </div>
  );
}
