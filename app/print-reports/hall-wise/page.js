'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HallWiseReportPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/hall-wise')
      .then(res => res.json())
      .then(res => {
        if (res.success) setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const totalCollected = data.reduce((sum, row) => sum + row.totalCollected, 0);
  const totalStudents = data.reduce((sum, row) => sum + row.studentCount, 0);

  if (loading) return <div style={{ padding: '20px' }}>Loading report...</div>;

  return (
    <div style={{ background: '#fff', color: '#000', minHeight: '100vh', padding: '40px', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }} className="no-print">
        <button onClick={() => router.back()} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>← Back</button>
        <button onClick={() => window.print()} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🖨️ Print Report</button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>Student Fee Management System</h1>
        <h2 style={{ fontSize: '18px', margin: '0', color: '#475569' }}>Hall-wise Collection Report</h2>
        <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#64748b' }}>Generated on: {new Date().toLocaleString()}</p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'left' }}>S.No</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'left' }}>Hall Name</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'center' }}>Hall Code</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'center' }}>Gender</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'right' }}>Students</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'right' }}>Total Collected (₹)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #cbd5e1', padding: '12px' }}>{idx + 1}</td>
              <td style={{ border: '1px solid #cbd5e1', padding: '12px', fontWeight: 'bold' }}>{row.name}</td>
              <td style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'center' }}>{row.code || 'N/A'}</td>
              <td style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'center' }}>{row.gender}</td>
              <td style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'right' }}>{row.studentCount}</td>
              <td style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '15px' }}>{row.totalCollected.toLocaleString('en-IN')}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', border: '1px solid #cbd5e1' }}>No collection data found</td></tr>
          )}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
            <td colSpan="4" style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'right' }}>GRAND TOTAL:</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'right' }}>{totalStudents}</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '16px' }}>₹ {totalCollected.toLocaleString('en-IN')}</td>
          </tr>
        </tfoot>
      </table>

      <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', padding: '0 50px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '10px' }}>Prepared By</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '10px' }}>Finance Officer</div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .no-print { display: none !important; }
          .page-layout, .sidebar { display: none !important; }
          .main-content { padding: 0 !important; margin: 0 !important; }
          div[style*="background: #fff"] * { visibility: visible; }
          div[style*="background: #fff"] { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
