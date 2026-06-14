'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CourseWiseReportPage() {
  const router = useRouter();
  const [admissionData, setAdmissionData] = useState([]);
  const [continuationData, setContinuationData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/master-data?table=admission_courses').then(r => r.json()),
      fetch('/api/master-data?table=continuation_courses').then(r => r.json())
    ]).then(([admRes, contRes]) => {
      if (admRes.data) setAdmissionData(admRes.data);
      if (contRes.data) setContinuationData(contRes.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Loading report...</div>;

  const renderTable = (data, title) => (
    <div style={{ marginBottom: '40px', pageBreakInside: 'avoid' }}>
      <h3 style={{ marginBottom: '15px', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '5px' }}>{title}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left' }}>Code</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left' }}>Course Name</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left' }}>Faculty</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>Duration</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right' }}>Min Fee (₹)</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right' }}>Max Fee (₹)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontFamily: 'monospace' }}>{row.CLASSCODE}</td>
              <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontWeight: 'bold' }}>{row.CLASS}</td>
              <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>{row.FACNAME || row.FACULTY}</td>
              <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>{row.DURATION}</td>
              <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right' }}>{parseFloat(row.min_fee).toLocaleString('en-IN')}</td>
              <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right' }}>{parseFloat(row.max_fee).toLocaleString('en-IN')}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', border: '1px solid #cbd5e1' }}>No courses found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ background: '#fff', color: '#000', minHeight: '100vh', padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }} className="no-print">
        <button onClick={() => router.back()} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>← Back</button>
        <button onClick={() => window.print()} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🖨️ Print Report</button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>Student Fee Management System</h1>
        <h2 style={{ fontSize: '18px', margin: '0', color: '#475569' }}>Course-wise Fee Chart</h2>
        <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#64748b' }}>Generated on: {new Date().toLocaleString()}</p>
      </div>

      {renderTable(admissionData, 'Admission Fee Structure')}
      {renderTable(continuationData, 'Continuation Fee Structure')}

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
