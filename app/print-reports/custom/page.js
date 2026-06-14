'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomReportPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('All');
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (status) params.append('status', status);

    try {
      const res = await fetch(`/api/reports/custom?${params.toString()}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
      setGenerated(true);
    } catch (err) {
      console.error(err);
      alert('Failed to generate report');
    }
    setLoading(false);
  };

  const safeParse = (jsonString) => {
    try {
      return jsonString ? JSON.parse(jsonString) : {};
    } catch {
      return {};
    }
  };

  const totalAmount = data.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);

  return (
    <div style={{ background: '#f8fafc', color: '#000', minHeight: '100vh', padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }} className="no-print">
        <button onClick={() => router.back()} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>← Back</button>
        {generated && (
          <button onClick={() => window.print()} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🖨️</span> Print Report
          </button>
        )}
      </div>

      <div className="no-print" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Custom Report Filters</h3>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 1 200px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 1 200px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 1 200px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
              <option value="All">All Statuses</option>
              <option value="Success">Success (Captured)</option>
              <option value="failed">Failed</option>
              <option value="created">Created</option>
            </select>
          </div>
          <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', height: '42px', flex: '1 1 150px', fontWeight: 'bold' }}>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </form>
      </div>

      {generated && (
        <div style={{ background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
            <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>Student Fee Management System</h1>
            <h2 style={{ fontSize: '18px', margin: '0', color: '#475569' }}>Custom Payment Report</h2>
            <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#64748b' }}>
              Generated on: {new Date().toLocaleString()}<br/>
              Filters Applied - Date: {startDate || 'Start'} to {endDate || 'End'} | Status: {status}
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'left' }}>S.No</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'left' }}>Date</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'left' }}>Payment ID</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'left' }}>Student Name</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'left' }}>Type</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>Status</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                const notes = safeParse(row.notes);
                return (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>{new Date(row.created_at).toLocaleDateString()}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px', fontFamily: 'monospace' }}>{row.id}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>{notes.name || 'Unknown'}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>{row.description || notes.type || '-'}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', color: (row.status === 'captured' || row.status === 'Success') ? '#10b981' : '#ef4444' }}>
                      {row.status}
                    </td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>{parseFloat(row.amount).toLocaleString('en-IN')}</td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', border: '1px solid #cbd5e1' }}>No payments found matching the criteria.</td></tr>
              )}
            </tbody>
            {data.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                  <td colSpan="6" style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'right' }}>Total (Visible records up to 500):</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'right', fontSize: '14px' }}>₹ {totalAmount.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            )}
          </table>

          <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', padding: '0 50px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '10px' }}>Prepared By</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '10px' }}>Finance Officer</div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .page-layout, .sidebar { display: none !important; }
          .main-content { padding: 0 !important; margin: 0 !important; }
          div[style*="background: #fff"] * { visibility: visible; }
          div[style*="background: #fff"] { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; border: none !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
