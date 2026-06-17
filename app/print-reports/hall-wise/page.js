'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import * as XLSX from 'xlsx';

const headNameMap = {
  'HALL GAMES': 'H GAMES',
  'HALL AMENITIES': 'H AMENITIES',
  'HALL MAGAZINE': 'H MAGAZINE',
  'MNTC OF CR.': 'MNTC',
  'C G/READING R.': 'CG/RR',
  'HALL LIT.SOC.': 'HL SOC',
  'HALL FUNCTION': 'H FUNC',
  'MISC. A/C-C': 'MISC A/C',
  'S T S SCHOOL BO': 'STS BD',
  'CAUTION MONEY': 'C MONEY'
};

export default function HallWiseReportPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [catCHeads, setCatCHeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/hall-wise')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          const rawData = res.data || [];
          const heads = res.categoryCHeads || [];
          const groupedMap = {};
          
          rawData.forEach(row => {
            const name = row.name || 'Unknown Hall';
            if (!groupedMap[name]) {
              groupedMap[name] = { ...row, name };
            } else {
              groupedMap[name].studentCount = Number(groupedMap[name].studentCount || 0) + Number(row.studentCount || 0);
              groupedMap[name].totalCollected = Number(groupedMap[name].totalCollected || 0) + Number(row.totalCollected || 0);
              heads.forEach(h => {
                groupedMap[name][h.HEAD_CODE] = Number(groupedMap[name][h.HEAD_CODE] || 0) + Number(row[h.HEAD_CODE] || 0);
              });
            }
          });
          
          const groupedData = Object.values(groupedMap).sort((a,b) => b.totalCollected - a.totalCollected);
          setData(groupedData);
          setCatCHeads(heads);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const totalCollected = data.reduce((sum, row) => sum + Number(row.totalCollected || 0), 0);
  const totalStudents = data.reduce((sum, row) => sum + Number(row.studentCount || 0), 0);

  const exportToExcel = () => {
    const headNames = catCHeads.map(h => headNameMap[h.SHORT_HEAD_NAME] || h.SHORT_HEAD_NAME);
    const excelData = [
      ['Student Fee Management System - Hall-wise Collection Report (With Category C Breakup)'],
      [`Generated on: ${new Date().toLocaleString()}`],
      [],
      ['S.No', 'Hall Name', ...headNames, 'Students', 'TOTAL']
    ];

    data.forEach((row, idx) => {
      const rowData = [
        idx + 1,
        row.name || 'Unknown Hall'
      ];
      catCHeads.forEach(h => {
        rowData.push(Number(row[h.HEAD_CODE] || 0));
      });
      rowData.push(Number(row.studentCount || 0));
      rowData.push(Number(row.totalCollected || 0));
      excelData.push(rowData);
    });

    excelData.push([]);
    const grandTotalRow = ['GRAND TOTAL', ''];
    catCHeads.forEach(h => {
      grandTotalRow.push(data.reduce((sum, row) => sum + Number(row[h.HEAD_CODE] || 0), 0));
    });
    grandTotalRow.push(totalStudents);
    grandTotalRow.push(totalCollected);
    excelData.push(grandTotalRow);

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hall-wise Breakup");
    XLSX.writeFile(wb, `Hall_Wise_Breakup_${new Date().getTime()}.xlsx`);
  };

  const printReport = () => {
    window.print();
  };

  const formatNumber = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  if (loading) return <div style={{ padding: 'var(--space-5)' }}>Loading report...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <div className="page-header" style={{ flexShrink: 0, '@media print': {display: 'none'} }}>
        <h1>Hall-wise Collection Report</h1>
        <p>Generate a printable chart or Excel export for hall-wise collections and Category C breakup</p>
      </div>

      <div className="glass-card" style={{padding:'var(--space-4)',marginBottom:'var(--space-5)', flexShrink: 0, '@media print': {display: 'none'} }}>
        <div className="filter-bar" style={{flexWrap: 'wrap'}}>
          <button onClick={() => router.back()} className="btn btn-secondary">
            ← Back
          </button>
          
          <div style={{display:'flex',gap:'var(--space-2)',marginLeft:'auto'}}>
            <button className="btn btn-export print-visible" onClick={exportToExcel} disabled={data.length === 0}>
              <span style={{marginRight:'8px'}}>📊</span> Export Excel
            </button>
            <button className="btn btn-primary print-visible" onClick={printReport} disabled={data.length === 0}>
              <span style={{marginRight:'8px'}}>🖨️</span> Print PDF
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding:'var(--space-5)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          
          <div className="print-visible" style={{display:'none', textAlign:'center', marginBottom:'2rem'}}>
            <h2>Aligarh Muslim University</h2>
            <h3>Student Section Fee Management</h3>
            <h4>Hall-wise Collection & Breakup Report</h4>
            <p><strong>Generated on:</strong> {new Date().toLocaleString()}</p>
          </div>

          <div className="table-container" style={{border:'none', flex: 1, overflow: 'auto'}}>
            <table className="data-table" style={{fontSize:'var(--text-xs)', minWidth: 'max-content'}}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 50 }}>
                <tr style={{background:'var(--bg-base)'}}>
                  <th style={{position: 'sticky', top: 0, left: 0, zIndex: 60, width: '50px', background:'var(--bg-base)'}}>S.No</th>
                  <th style={{position: 'sticky', top: 0, left: '50px', zIndex: 60, background:'var(--bg-base)', width: '150px', minWidth: '150px', maxWidth: '180px', whiteSpace: 'normal', wordWrap: 'break-word'}}>Hall Name</th>
                  {catCHeads.map(h => (
                    <th key={h.HEAD_CODE} style={{position: 'sticky', top: 0, zIndex: 50, textAlign:'right'}}>{headNameMap[h.SHORT_HEAD_NAME] || h.SHORT_HEAD_NAME}</th>
                  ))}
                  <th style={{position: 'sticky', top: 0, zIndex: 50, textAlign:'right'}}>Students</th>
                  <th style={{position: 'sticky', top: 0, right: 0, zIndex: 60, textAlign:'right', background:'var(--bg-base)'}}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{position: 'sticky', left: 0, zIndex: 10, background:'var(--bg-elevated)'}}>{idx + 1}</td>
                    <td style={{fontWeight:500, position: 'sticky', left: '50px', zIndex: 10, background:'var(--bg-elevated)', width: '150px', minWidth: '150px', maxWidth: '180px', whiteSpace: 'normal', wordWrap: 'break-word'}}>{row.name}</td>
                    {catCHeads.map(h => (
                      <td key={h.HEAD_CODE} style={{textAlign:'right', fontFamily:'monospace'}}>{formatNumber(row[h.HEAD_CODE])}</td>
                    ))}
                    <td style={{textAlign:'right',fontWeight:500}}>{row.studentCount}</td>
                    <td style={{position: 'sticky', right: 0, zIndex: 10, textAlign:'right',fontWeight:700,color:'var(--accent-emerald-soft)', background:'var(--bg-elevated)'}}>{formatNumber(row.totalCollected)}</td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={4 + catCHeads.length} style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                      No collection data found
                    </td>
                  </tr>
                )}
                {data.length > 0 && (
                  <tr style={{background:'var(--bg-hover)',fontWeight:700,fontSize:'var(--text-sm)'}}>
                    <td colSpan="2" style={{position: 'sticky', left: 0, zIndex: 10, textAlign:'right', fontWeight:800, background:'var(--bg-hover)'}}>GRAND TOTAL (₹)</td>
                    {catCHeads.map(h => (
                      <td key={h.HEAD_CODE} style={{textAlign:'right', fontFamily:'monospace', color:'var(--text-primary)'}}>
                        {formatNumber(data.reduce((sum, row) => sum + Number(row[h.HEAD_CODE] || 0), 0))}
                      </td>
                    ))}
                    <td style={{textAlign:'right', color:'var(--text-primary)'}}>{totalStudents}</td>
                    <td style={{position: 'sticky', right: 0, zIndex: 10, textAlign:'right', color:'var(--accent-emerald-soft)', background:'var(--bg-hover)'}}>{formatNumber(totalCollected)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="print-visible" style={{display:'none', marginTop: '50px', justifyContent: 'space-between', padding: '0 50px'}}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid var(--text-primary)', width: '200px', paddingTop: '10px' }}>Prepared By</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid var(--text-primary)', width: '200px', paddingTop: '10px' }}>Finance Officer</div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
