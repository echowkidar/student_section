'use client';
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import * as XLSX from 'xlsx';

const CAT_COLORS = { A: { bg: 'var(--accent-blue-dim)', text: 'var(--accent-blue-soft)', label: 'University Fee' }, B: { bg: 'var(--accent-emerald-dim)', text: 'var(--accent-emerald-soft)', label: 'Union & Activities' }, C: { bg: 'var(--accent-amber-dim)', text: 'var(--accent-amber-soft)', label: 'Hall Fees' }, D: { bg: 'var(--accent-purple-dim)', text: 'var(--accent-purple-soft)', label: 'Refundable Deposits' } };

export default function DistributedCollectionReport() {
  const [type, setType] = useState('admission');
  const [groupBy, setGroupBy] = useState('course'); // 'course' or 'faculty'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/distributed?type=${type}`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [type]);

  const heads = data?.heads || [];
  const feeMaster = data?.feeMaster || [];
  const studentCounts = data?.studentCounts || [];
  const courseGroups = data?.courseGroups || [];

  // 1. Group Heads by Category
  const groupedHeads = {};
  heads.forEach(h => { if (!groupedHeads[h.CATEGORY]) groupedHeads[h.CATEGORY] = []; groupedHeads[h.CATEGORY].push(h); });

  // 2. Aggregate Data
  // We want an array of objects representing rows in our table
  let reportRows = [];

  if (groupBy === 'course') {
    // Unique courses
    const uniqueCourses = [...new Set(feeMaster.map(f => f.CLASSCODE))];
    
    uniqueCourses.forEach(code => {
      const courseMaster = feeMaster.filter(f => f.CLASSCODE === code);
      if (courseMaster.length === 0) return;
      
      const courseInfo = courseMaster[0];
      const counts = studentCounts.filter(c => c.programme_code === code);
      const nrCount = counts.find(c => c.r_nr === 'N')?.student_count || 0;
      const rCount = counts.find(c => c.r_nr === 'R')?.student_count || 0;
      const totalStudents = Number(nrCount) + Number(rCount);
      
      if (totalStudents === 0) return; // Skip if no payments

      const nrMaster = courseMaster.find(m => m.R_NR === 'N');
      const rMaster = courseMaster.find(m => m.R_NR === 'R');

      let row = {
        title: `${courseInfo.CLASS} (${code})`,
        subtitle: courseInfo.FACNAME,
        nrCount: Number(nrCount),
        rCount: Number(rCount),
        heads: {}
      };

      let nrTotal = 0;
      let rTotal = 0;

      heads.forEach(h => {
        const nrFee = nrMaster ? parseFloat(nrMaster[h.HEAD_CODE] || 0) : 0;
        const rFee = rMaster ? parseFloat(rMaster[h.HEAD_CODE] || 0) : 0;
        const nrCollected = nrFee * Number(nrCount);
        const rCollected = rFee * Number(rCount);
        row.heads[h.HEAD_CODE] = { nr: nrCollected, r: rCollected, total: nrCollected + rCollected };
        nrTotal += nrCollected;
        rTotal += rCollected;
      });

      row.totalCollected = nrTotal + rTotal;
      reportRows.push(row);
    });
  } else if (groupBy === 'faculty') {
    const uniqueFaculties = [...new Set(feeMaster.map(f => f.FACULTY))];
    
    uniqueFaculties.forEach(fac => {
      const facMaster = feeMaster.filter(f => f.FACULTY === fac);
      if (facMaster.length === 0) return;
      const facName = facMaster[0].FACNAME;

      // Find all courses in this faculty
      const facCourses = [...new Set(facMaster.map(f => f.CLASSCODE))];
      
      let row = {
        title: facName,
        subtitle: `Faculty Code: ${fac}`,
        nrCount: 0,
        rCount: 0,
        heads: {}
      };

      heads.forEach(h => row.heads[h.HEAD_CODE] = { nr: 0, r: 0, total: 0 });
      let facTotalCollected = 0;

      facCourses.forEach(code => {
        const courseMaster = facMaster.filter(f => f.CLASSCODE === code);
        const counts = studentCounts.filter(c => c.programme_code === code);
        const nrCount = counts.find(c => c.r_nr === 'N')?.student_count || 0;
        const rCount = counts.find(c => c.r_nr === 'R')?.student_count || 0;
        
        row.nrCount += Number(nrCount);
        row.rCount += Number(rCount);

        const nrMaster = courseMaster.find(m => m.R_NR === 'N');
        const rMaster = courseMaster.find(m => m.R_NR === 'R');

        heads.forEach(h => {
          const nrFee = nrMaster ? parseFloat(nrMaster[h.HEAD_CODE] || 0) : 0;
          const rFee = rMaster ? parseFloat(rMaster[h.HEAD_CODE] || 0) : 0;
          const nrCollected = nrFee * Number(nrCount);
          const rCollected = rFee * Number(rCount);
          row.heads[h.HEAD_CODE].nr += nrCollected;
          row.heads[h.HEAD_CODE].r += rCollected;
          row.heads[h.HEAD_CODE].total += (nrCollected + rCollected);
          facTotalCollected += (nrCollected + rCollected);
        });
      });

      row.totalCollected = facTotalCollected;
      if (row.nrCount > 0 || row.rCount > 0) {
        reportRows.push(row);
      }
    });
  } else if (groupBy === 'course-group') {
    // 1. Map all courses to their respective groups
    const groupedCourseCodes = new Set();
    
    courseGroups.forEach(group => {
      if (!group.courses || group.courses.length === 0) return;
      
      const courseNames = group.courses.map(code => {
        const match = feeMaster.find(f => f.CLASSCODE === code);
        return match ? match.CLASS : code;
      });
      
      let row = {
        title: group.group_name,
        subtitle: courseNames.join(', '),
        nrCount: 0,
        rCount: 0,
        heads: {}
      };
      heads.forEach(h => row.heads[h.HEAD_CODE] = { nr: 0, r: 0, total: 0 });
      let groupTotalCollected = 0;

      group.courses.forEach(code => {
        groupedCourseCodes.add(code);
        const courseMaster = feeMaster.filter(f => f.CLASSCODE === code);
        const counts = studentCounts.filter(c => c.programme_code === code);
        const nrCount = counts.find(c => c.r_nr === 'N')?.student_count || 0;
        const rCount = counts.find(c => c.r_nr === 'R')?.student_count || 0;
        
        row.nrCount += Number(nrCount);
        row.rCount += Number(rCount);

        const nrMaster = courseMaster.find(m => m.R_NR === 'N');
        const rMaster = courseMaster.find(m => m.R_NR === 'R');

        heads.forEach(h => {
          const nrFee = nrMaster ? parseFloat(nrMaster[h.HEAD_CODE] || 0) : 0;
          const rFee = rMaster ? parseFloat(rMaster[h.HEAD_CODE] || 0) : 0;
          const nrCollected = nrFee * Number(nrCount);
          const rCollected = rFee * Number(rCount);
          row.heads[h.HEAD_CODE].nr += nrCollected;
          row.heads[h.HEAD_CODE].r += rCollected;
          row.heads[h.HEAD_CODE].total += (nrCollected + rCollected);
          groupTotalCollected += (nrCollected + rCollected);
        });
      });

      row.totalCollected = groupTotalCollected;
      if (row.nrCount > 0 || row.rCount > 0) {
        reportRows.push(row);
      }
    });

    // 2. Handle Ungrouped Courses
    const uniqueCourses = [...new Set(feeMaster.map(f => f.CLASSCODE))];
    const ungroupedCourses = uniqueCourses.filter(c => !groupedCourseCodes.has(c));
    
    if (ungroupedCourses.length > 0) {
      let ungroupedRow = {
        title: "Ungrouped Courses",
        subtitle: "Courses not assigned to any group",
        nrCount: 0,
        rCount: 0,
        heads: {}
      };
      heads.forEach(h => ungroupedRow.heads[h.HEAD_CODE] = { nr: 0, r: 0, total: 0 });
      let ungroupedTotalCollected = 0;

      ungroupedCourses.forEach(code => {
        const courseMaster = feeMaster.filter(f => f.CLASSCODE === code);
        const counts = studentCounts.filter(c => c.programme_code === code);
        const nrCount = counts.find(c => c.r_nr === 'N')?.student_count || 0;
        const rCount = counts.find(c => c.r_nr === 'R')?.student_count || 0;
        
        ungroupedRow.nrCount += Number(nrCount);
        ungroupedRow.rCount += Number(rCount);

        const nrMaster = courseMaster.find(m => m.R_NR === 'N');
        const rMaster = courseMaster.find(m => m.R_NR === 'R');

        heads.forEach(h => {
          const nrFee = nrMaster ? parseFloat(nrMaster[h.HEAD_CODE] || 0) : 0;
          const rFee = rMaster ? parseFloat(rMaster[h.HEAD_CODE] || 0) : 0;
          const nrCollected = nrFee * Number(nrCount);
          const rCollected = rFee * Number(rCount);
          ungroupedRow.heads[h.HEAD_CODE].nr += nrCollected;
          ungroupedRow.heads[h.HEAD_CODE].r += rCollected;
          ungroupedRow.heads[h.HEAD_CODE].total += (nrCollected + rCollected);
          ungroupedTotalCollected += (nrCollected + rCollected);
        });
      });

      ungroupedRow.totalCollected = ungroupedTotalCollected;
      if (ungroupedRow.nrCount > 0 || ungroupedRow.rCount > 0) {
        reportRows.push(ungroupedRow);
      }
    }
  }

  // Calculate Grand Totals
  let grandTotal = { nrCount: 0, rCount: 0, total: 0, heads: {} };
  heads.forEach(h => grandTotal.heads[h.HEAD_CODE] = { nr: 0, r: 0, total: 0 });
  
  reportRows.forEach(row => {
    grandTotal.nrCount += row.nrCount;
    grandTotal.rCount += row.rCount;
    grandTotal.total += row.totalCollected;
    heads.forEach(h => {
      grandTotal.heads[h.HEAD_CODE].nr += row.heads[h.HEAD_CODE].nr;
      grandTotal.heads[h.HEAD_CODE].r += row.heads[h.HEAD_CODE].r;
      grandTotal.heads[h.HEAD_CODE].total += row.heads[h.HEAD_CODE].total;
    });
  });

  const relevantHeads = heads.filter(h => grandTotal.heads[h.HEAD_CODE].total > 0);

  const exportToExcel = () => {
    if (reportRows.length === 0) return;
    
    // Create Excel Workbook
    const wb = XLSX.utils.book_new();

    // 1. Summary Sheet
    const summaryData = [
      ['ALIGARH MUSLIM UNIVERSITY'],
      ['Total Distributed Collection Summary'],
      [`Type: ${type === 'admission' ? 'Admission' : 'Continuation'}`],
      [`Grouped By: ${groupBy.toUpperCase()}`],
      [],
      ['Name', 'Non-Resident Students', 'Resident Students', 'Total Distributed Collection (₹)']
    ];
    
    reportRows.forEach(r => {
      summaryData.push([r.title, r.nrCount, r.rCount, r.totalCollected]);
    });
    summaryData.push([]);
    summaryData.push(['GRAND TOTAL', grandTotal.nrCount, grandTotal.rCount, grandTotal.total]);
    
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // 2. Head-wise Detailed Breakdown Sheet
    // We will mimic the Controller Office format: vertical blocks of heads for each course/faculty.
    const detailsData = [];
    detailsData.push(['ALIGARH MUSLIM UNIVERSITY']);
    detailsData.push(['Distributed Head-wise Collection Breakup']);
    detailsData.push([`Type: ${type === 'admission' ? 'Admission' : 'Continuation'}`]);
    detailsData.push([]);

    reportRows.forEach(r => {
      detailsData.push([r.title]);
      detailsData.push([r.subtitle]);
      detailsData.push(['Students Paid:', `NR: ${r.nrCount}`, `R: ${r.rCount}`]);
      detailsData.push(['Head of Account', 'Code', 'NON-RESIDENT (₹)', 'RESIDENT (₹)', 'TOTAL (₹)']);
      
      Object.entries(groupedHeads).forEach(([cat, catHeads]) => {
        let hasData = false;
        // Check if category has any money
        catHeads.forEach(h => { if (r.heads[h.HEAD_CODE].total > 0) hasData = true; });
        
        if (hasData) {
          detailsData.push([`--- Category ${cat} ---`, '', '', '', '']);
          catHeads.forEach(h => {
            const vals = r.heads[h.HEAD_CODE];
            if (vals.total > 0) {
              detailsData.push([h.HEAD_NAME || h.SHORT_HEAD_NAME, h.HEAD_CODE, vals.nr, vals.r, vals.total]);
            }
          });
        }
      });
      detailsData.push(['TOTAL COLLECTED', '', '', '', r.totalCollected]);
      detailsData.push([]);
      detailsData.push([]);
    });

    // Grand total block
    detailsData.push(['*** GRAND TOTAL ACROSS ALL ***']);
    detailsData.push(['Head of Account', 'Code', 'NON-RESIDENT (₹)', 'RESIDENT (₹)', 'TOTAL (₹)']);
    Object.entries(groupedHeads).forEach(([cat, catHeads]) => {
        let hasData = false;
        catHeads.forEach(h => { if (grandTotal.heads[h.HEAD_CODE].total > 0) hasData = true; });
        if (hasData) {
          detailsData.push([`--- Category ${cat} ---`, '', '', '', '']);
          catHeads.forEach(h => {
            const vals = grandTotal.heads[h.HEAD_CODE];
            if (vals.total > 0) {
              detailsData.push([h.HEAD_NAME || h.SHORT_HEAD_NAME, h.HEAD_CODE, vals.nr, vals.r, vals.total]);
            }
          });
        }
    });
    detailsData.push(['GRAND TOTAL DISTRIBUTED', '', '', '', grandTotal.total]);

    const wsDetails = XLSX.utils.aoa_to_sheet(detailsData);
    XLSX.utils.book_append_sheet(wb, wsDetails, 'Head-wise Breakup');

    // Save
    XLSX.writeFile(wb, `Distributed_Collection_${groupBy}_${type}.xlsx`);
  };

  const printReport = () => window.print();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <div className="print-visible" style={{display:'none', textAlign:'center', marginBottom:'2rem'}}>
        <h2>Aligarh Muslim University</h2>
        <h3>Distributed Collection Breakup</h3>
        <h4>{type === 'admission' ? 'Admission' : 'Continuation'} Fees — {groupBy === 'course' ? 'Course-wise' : groupBy === 'faculty' ? 'Faculty-wise' : 'Course Group-wise'}</h4>
      </div>

      <div className="page-header" style={{ flexShrink: 0, '@media print': {display: 'none'} }}>
        <div>
          <h1>💰 Distributed Collection Report</h1>
          <p>Calculates the actual received payments dynamically distributed into their respective Heads of Account.</p>
        </div>
      </div>

      <div className="glass-card" style={{padding:'var(--space-4)',marginBottom:'var(--space-5)', flexShrink: 0, '@media print': {display: 'none'} }}>
        <div className="filter-bar" style={{flexWrap: 'wrap'}}>
          <div style={{display:'flex',gap:'2px',background:'var(--bg-input)',borderRadius:'var(--radius-md)',padding:'2px'}}>
            <button onClick={() => setType('admission')} style={{padding:'var(--space-2) var(--space-5)',borderRadius:'var(--radius-md)',border:'none',cursor:'pointer',fontWeight:600,fontSize:'var(--text-sm)',background: type==='admission' ? 'var(--accent-blue)' : 'transparent', color: type==='admission' ? 'white' : 'var(--text-secondary)'}}>Admission Payments</button>
            <button onClick={() => setType('continuation')} style={{padding:'var(--space-2) var(--space-5)',borderRadius:'var(--radius-md)',border:'none',cursor:'pointer',fontWeight:600,fontSize:'var(--text-sm)',background: type==='continuation' ? 'var(--accent-emerald)' : 'transparent', color: type==='continuation' ? 'white' : 'var(--text-secondary)'}}>Continuation Payments</button>
          </div>
          
          <select className="form-select" style={{maxWidth:'200px'}} value={groupBy} onChange={e => setGroupBy(e.target.value)}>
            <option value="course">Course-wise</option>
            <option value="faculty">Faculty-wise</option>
            <option value="course-group">Course Group-wise</option>
          </select>

          {reportRows.length > 0 && (
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

      {!loading && reportRows.length === 0 && (
         <div className="glass-card" style={{padding:'var(--space-8)',textAlign:'center', flexShrink: 0}}>
           <div style={{fontSize:'3rem',marginBottom:'var(--space-3)'}}>📭</div>
           <p style={{color:'var(--text-secondary)'}}>No payments found to distribute for {type} fees.</p>
         </div>
      )}

      {reportRows.length > 0 && (
        <div className="glass-card" style={{ flex: 1, minHeight: 0, padding:'var(--space-5)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="table-container" style={{border:'none', flex: 1, overflow: 'auto', width: '100%'}}>
            <table className="data-table" style={{fontSize:'var(--text-xs)'}}>
              <thead>
                <tr style={{background:'var(--bg-base)'}}>
                  <th style={{width:'40%', minWidth:'400px', position: 'sticky', left: 0, zIndex: 3, background:'var(--bg-base)', boxShadow: '2px 0 5px rgba(0,0,0,0.1)'}}>{groupBy === 'course' ? 'Course' : groupBy === 'faculty' ? 'Faculty' : 'Course Group'}</th>
                  <th style={{textAlign:'center', minWidth:'150px'}}>Payments (NR / R)</th>
                  {relevantHeads.map(h => (
                    <th key={h.HEAD_CODE} style={{textAlign:'right', minWidth:'100px'}} title={h.HEAD_NAME}>
                      {h.SHORT_HEAD_NAME || h.HEAD_CODE}
                    </th>
                  ))}
                  <th style={{textAlign:'right', background:'var(--bg-elevated)'}}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((r, i) => (
                  <tr key={i} style={{background: 'var(--bg-surface)'}}>
                    <td style={{fontWeight:600, position: 'sticky', left: 0, zIndex: 1, background: 'inherit', boxShadow: '2px 0 5px rgba(0,0,0,0.1)'}}>
                      {r.title}
                      <div style={{fontSize:'var(--text-xs)', color:'var(--text-tertiary)', fontWeight:400}}>{r.subtitle}</div>
                    </td>
                    <td style={{textAlign:'center'}}>
                      <span style={{color:'var(--accent-blue-soft)'}}>{r.nrCount}</span> / <span style={{color:'var(--accent-emerald-soft)'}}>{r.rCount}</span>
                    </td>
                    {relevantHeads.map(h => {
                      const val = r.heads[h.HEAD_CODE].total;
                      return (
                        <td key={h.HEAD_CODE} style={{textAlign:'right', color: val > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)'}}>
                          {val > 0 ? formatCurrency(val) : '—'}
                        </td>
                      );
                    })}
                    <td style={{textAlign:'right', fontWeight:700, background:'var(--bg-hover)'}}>
                      {formatCurrency(r.totalCollected)}
                    </td>
                  </tr>
                ))}
                {/* Grand Total Row */}
                <tr style={{background:'var(--accent-amber-dim)', color:'var(--accent-amber-soft)', fontWeight:800}}>
                  <td style={{position: 'sticky', left: 0, zIndex: 1, background: 'var(--bg-elevated)', boxShadow: '2px 0 5px rgba(0,0,0,0.1)'}}>GRAND TOTAL</td>
                  <td style={{textAlign:'center'}}>{grandTotal.nrCount} / {grandTotal.rCount}</td>
                  {relevantHeads.map(h => (
                    <td key={h.HEAD_CODE} style={{textAlign:'right'}}>
                      {grandTotal.heads[h.HEAD_CODE].total > 0 ? formatCurrency(grandTotal.heads[h.HEAD_CODE].total) : '—'}
                    </td>
                  ))}
                  <td style={{textAlign:'right', fontSize:'var(--text-sm)'}}>
                    {formatCurrency(grandTotal.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          @page { size: landscape; }
          .print-visible[style*="display: none"] { display: block !important; }
          .glass-card > div.filter-bar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
