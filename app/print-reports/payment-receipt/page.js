'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentReceiptPage() {
  const router = useRouter();
  const [paymentId, setPaymentId] = useState('');
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPayment = async (e) => {
    e.preventDefault();
    if (!paymentId) return;
    
    setLoading(true);
    setError('');
    setPayment(null);

    try {
      const res = await fetch(`/api/payments/${paymentId.trim()}`);
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Payment not found');
      } else {
        setPayment(data.payment);
      }
    } catch (err) {
      setError('Network error. Please try again.');
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

  return (
    <div style={{ background: '#f8fafc', color: '#000', minHeight: '100vh', padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', maxWidth: '800px', margin: '0 auto 30px' }} className="no-print">
        <button onClick={() => router.back()} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>← Back</button>
        {payment && (
          <button onClick={() => window.print()} style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🖨️</span> Print Receipt
          </button>
        )}
      </div>

      <div className="no-print" style={{ maxWidth: '800px', margin: '0 auto 30px', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Find Payment Receipt</h3>
        <form onSubmit={fetchPayment} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Enter Payment ID (e.g. pay_xxxxx)" 
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            required
          />
          <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
        {error && <p style={{ color: '#ef4444', marginTop: '10px', fontSize: '14px' }}>{error}</p>}
      </div>

      {payment && (() => {
        const notes = safeParse(payment.notes);
        return (
          <div className="receipt-container" style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '40px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1e293b', paddingBottom: '20px', marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img src="/android-chrome-192x192.png" alt="Logo" style={{ width: '80px', height: '80px' }} />
                <div>
                  <h1 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#1e293b' }}>ALIGARH MUSLIM UNIVERSITY</h1>
                  <h2 style={{ margin: '0', fontSize: '16px', color: '#64748b', fontWeight: 'normal' }}>Student Fee Management System</h2>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#3b82f6' }}>RECEIPT</h2>
                <p style={{ margin: '0', fontSize: '14px', color: '#64748b' }}>Date: {new Date(payment.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Student Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#94a3b8', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Billed To</h4>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '18px' }}>{notes.name || payment.contact || 'N/A'}</p>
                <p style={{ margin: '0 0 5px 0', color: '#475569' }}>Email: {payment.email || notes.email || 'N/A'}</p>
                {notes.programme_code && <p style={{ margin: '0 0 5px 0', color: '#475569' }}>Course: {notes.programme_code}</p>}
                {notes.application_no && <p style={{ margin: '0', color: '#475569' }}>App/Enrol No: {notes.application_no}</p>}
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#94a3b8', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Payment Details</h4>
                <p style={{ margin: '0 0 5px 0', color: '#475569' }}><strong>Receipt No:</strong> {payment.id}</p>
                <p style={{ margin: '0 0 5px 0', color: '#475569' }}><strong>Transaction ID:</strong> {payment.order_id || 'N/A'}</p>
                <p style={{ margin: '0 0 5px 0', color: '#475569' }}><strong>Method:</strong> {payment.method ? payment.method.toUpperCase() : 'N/A'}</p>
                <p style={{ margin: '0', color: '#475569' }}>
                  <strong>Status:</strong>{' '}
                  <span style={{ color: payment.status === 'captured' || payment.status === 'Success' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                    {payment.status.toUpperCase()}
                  </span>
                </p>
              </div>
            </div>

            {/* Fee Breakdown */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#334155' }}>Description</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#334155' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '15px 12px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{payment.description || notes.type || 'Fee Payment'}</div>
                  </td>
                  <td style={{ padding: '15px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontSize: '16px' }}>
                    ₹ {parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '50px' }}>
              <div style={{ width: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>Subtotal</span>
                  <span>₹ {parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', fontWeight: 'bold', fontSize: '20px', color: '#0f172a' }}>
                  <span>Total Paid</span>
                  <span>₹ {parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '40px', borderTop: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0', fontSize: '12px', color: '#94a3b8' }}>This is a computer generated receipt and does not require a physical signature.</p>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #94a3b8', width: '150px', marginBottom: '5px' }}></div>
                <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>Authorized Signatory</p>
              </div>
            </div>
          </div>
        );
      })()}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .page-layout, .sidebar { display: none !important; }
          .main-content { padding: 0 !important; margin: 0 !important; }
          .receipt-container * { visibility: visible; }
          .receipt-container { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            padding: 0 !important; 
            border: none !important; 
            box-shadow: none !important; 
          }
        }
      `}</style>
    </div>
  );
}
