'use client';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

export default function FeeStructurePage() {
  const [type, setType] = useState('admission');
  const [groupBy, setGroupBy] = useState('course'); // 'course' | 'faculty' | 'course-group'
  const [course, setCourse] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let url = `/api/fee-structure?type=${type}`;
    if (course) {
      if (groupBy === 'course-group') {
        const group = data?.courseGroups?.find(g => g.id.toString() === course);
        if (group && group.courses.length > 0) {
          url += `&groupCourses=${group.courses.join(',')}`;
        } else {
          url += `&course=unknown`;
        }
      } else if (groupBy === 'faculty') {
        url += `&faculty=${course}`;
      } else {
        url += `&course=${course}`;
      }
    }

    fetch(url)
      .then(r => r.json())
      .then(d => { 
        setData(prev => ({ ...d, courseGroups: d.courseGroups || prev?.courseGroups })); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, [type, course, groupBy]);

  const feeStructure = data?.feeStructure || [];
  const courses = data?.courses || [];
  const faculties = data?.faculties || [];
  const courseGroups = data?.courseGroups || [];
  const heads = data?.heads || [];

  // Get fee columns that have non-null values
  const feeColumns = heads.filter(h => feeStructure.some(r => r[h.HEAD_CODE] && parseFloat(r[h.HEAD_CODE]) > 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <div className="page-header" style={{ flexShrink: 0 }}><h1>💰 Fee Structure</h1><p>View and compare fee structures for all courses</p></div>

      <div className="glass-card" style={{padding:'var(--space-4)',marginBottom:'var(--space-5)', flexShrink: 0}}>
        <div className="filter-bar">
          <div style={{display:'flex',gap:'2px',background:'var(--bg-input)',borderRadius:'var(--radius-md)',padding:'2px'}}>
            <button onClick={() => { setType('admission'); setCourse(''); }} style={{padding:'var(--space-2) var(--space-5)',borderRadius:'var(--radius-md)',border:'none',cursor:'pointer',fontWeight:600,fontSize:'var(--text-sm)',background:type==='admission'?'var(--accent-blue)':'transparent',color:type==='admission'?'white':'var(--text-secondary)'}}>Admission</button>
            <button onClick={() => { setType('continuation'); setCourse(''); }} style={{padding:'var(--space-2) var(--space-5)',borderRadius:'var(--radius-md)',border:'none',cursor:'pointer',fontWeight:600,fontSize:'var(--text-sm)',background:type==='continuation'?'var(--accent-emerald)':'transparent',color:type==='continuation'?'white':'var(--text-secondary)'}}>Continuation</button>
          </div>
          
          <select className="form-select" style={{maxWidth:'200px'}} value={groupBy} onChange={e => { setGroupBy(e.target.value); setCourse(''); }}>
            <option value="course">Course Filter</option>
            <option value="faculty">Faculty Filter</option>
            <option value="course-group">Course Group Filter</option>
          </select>

          <select className="form-select" style={{maxWidth:'350px'}} value={course} onChange={e => setCourse(e.target.value)}>
            <option value="">— All {groupBy === 'course' ? 'Courses' : groupBy === 'faculty' ? 'Faculties' : 'Course Groups'} —</option>
            {groupBy === 'course-group' && courseGroups.map(g => (
              <option key={g.id} value={g.id.toString()}>{g.group_name} ({g.courses.length} courses)</option>
            ))}
            {groupBy === 'faculty' && faculties.map(fac => (
              <option key={fac.FACULTY} value={fac.FACULTY}>{fac.FACNAME}</option>
            ))}
            {groupBy === 'course' && courses.map(c => (
              <option key={c.CLASSCODE} value={c.CLASSCODE}>{c.CLASS} ({c.CLASSCODE})</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="glass-card" style={{padding:'var(--space-8)',textAlign:'center', flexShrink: 0}}><p style={{color:'var(--text-tertiary)'}}>Loading fee structure...</p></div>
      ) : feeStructure.length > 0 ? (
        <div className="glass-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{padding:'var(--space-5) var(--space-5) 0', flexShrink: 0}}>
            <h4>Fee Structure ({feeStructure.length} combinations)</h4>
          </div>
          <div className="table-container" style={{border:'none', flex: 1, overflow: 'auto'}}>
            <table className="data-table" style={{fontSize:'var(--text-xs)'}}>
              <thead><tr>
                <th style={{position:'sticky',left:0,background:'var(--bg-elevated)',zIndex:3,minWidth:'250px'}}>Course</th>
                <th>R/NR</th><th>I/E</th><th>Sex</th>
                {feeColumns.map(h => <th key={h.HEAD_CODE} title={h.HEAD_CODE} style={{textAlign:'right',minWidth:'120px'}}>{h.SHORT_HEAD_NAME || h.HEAD_NAME || h.HEAD_CODE}</th>)}
                <th style={{textAlign:'right',background:'var(--accent-blue-dim)',color:'var(--accent-blue-soft)',fontWeight:700}}>TOTAL</th>
              </tr></thead>
              <tbody>
                {feeStructure.map((row, i) => (
                  <tr key={i}>
                    <td style={{position:'sticky',left:0,background:'var(--bg-surface)',fontWeight:500,minWidth:'250px',maxWidth:'350px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',zIndex:1}} title={row.CLASS}>{row.CLASS}</td>
                    <td><span style={{padding:'1px 6px',borderRadius:'var(--radius-full)',fontSize:'10px',fontWeight:600,background:row.R_NR==='R'?'var(--accent-emerald-dim)':'var(--accent-amber-dim)',color:row.R_NR==='R'?'var(--accent-emerald-soft)':'var(--accent-amber-soft)'}}>{row.R_NR==='R'?'Resident':'Non-Res'}</span></td>
                    <td style={{color:'var(--text-secondary)'}}>{row.IE==='I'?'Internal':'External'}</td>
                    <td>{row.SEX==='M'?'👦':'👧'}</td>
                    {feeColumns.map(h => <td key={h.HEAD_CODE} style={{textAlign:'right',color: row[h.HEAD_CODE] && parseFloat(row[h.HEAD_CODE]) > 0 ? 'var(--text-primary)' : 'var(--text-muted)'}}>{row[h.HEAD_CODE] && parseFloat(row[h.HEAD_CODE]) > 0 ? formatCurrency(row[h.HEAD_CODE]) : '—'}</td>)}
                    <td style={{textAlign:'right',fontWeight:700,color:'var(--accent-blue-soft)',background:'rgba(59,130,246,0.05)'}}>{formatCurrency(row.TOT_AMT)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{padding:'var(--space-8)',textAlign:'center', flexShrink: 0}}>
          <div style={{fontSize:'3rem',marginBottom:'var(--space-3)'}}>📊</div>
          <p style={{color:'var(--text-secondary)'}}>Select a faculty or course to view the fee structure</p>
        </div>
      )}
    </div>
  );
}
