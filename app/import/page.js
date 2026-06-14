'use client';
import { useState, useRef, useEffect } from 'react';

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [table, setTable] = useState('payment');
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const [userRole, setUserRole] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        setUserRole(d.user?.role || 'user');
        setAuthChecked(true);
      })
      .catch(() => {
        setUserRole('user');
        setAuthChecked(true);
      });
  }, []);

  const handleFile = (f) => {
    setFile(f); setPreview(null); setResult(null); setError(null);
    // Auto-preview
    const formData = new FormData();
    formData.append('file', f);
    formData.append('table', table);
    formData.append('preview', 'true');
    fetch('/api/import', { method: 'POST', body: formData })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setPreview(d); })
      .catch(e => setError(e.message));
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };
  const handleImport = async () => {
    if (!file) return;
    setImporting(true); setError(null); setResult(null);
    const formData = new FormData();
    formData.append('file', file); formData.append('table', table);
    try {
      const res = await fetch('/api/import', { method: 'POST', body: formData });
      const d = await res.json();
      if (d.error) setError(d.error); else setResult(d);
    } catch (e) { setError(e.message); }
    setImporting(false);
  };

  if (!authChecked) {
    return (
      <div className="page-header">
        <h1>📥 Import Data</h1>
        <p>Checking access rights...</p>
      </div>
    );
  }

  if (userRole !== 'admin' && userRole !== 'sub admin' && userRole !== 'sub_admin') {
    return (
      <div>
        <div className="page-header">
          <h1>📥 Import Data</h1>
          <p>Upload Excel files received from the Controller's Office</p>
        </div>
        <div className="glass-card" style={{ padding: 'var(--space-8)', textAlign: 'center', marginTop: 'var(--space-6)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>🚫</div>
          <h2 style={{ color: 'var(--accent-rose)', marginBottom: 'var(--space-4)' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Only Administrators and Sub-Administrators can import data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>📥 Import Data</h1>
        <p>Upload Excel files received from the Controller's Office</p>
      </div>

      {/* Table Selection */}
      <div className="glass-card" style={{padding:'var(--space-5)',marginBottom:'var(--space-5)'}}>
        <label className="form-label" style={{marginBottom:'var(--space-2)',display:'block'}}>Target Table</label>
        <select className="form-select" style={{maxWidth:'400px'}} value={table} onChange={e => setTable(e.target.value)}>
          <option value="payment">Payment Transactions</option>
          <option value="admission_course_code_fee">Admission Course Code & Fee</option>
          <option value="continuation_course_code_fee">Continuation Course Code & Fee</option>
          <option value="hall_name_code">Hall Name & Code</option>
          <option value="head_of_account_name_code">Head of Account Name & Code</option>
        </select>
      </div>

      {/* Upload Area */}
      <div className="glass-card" style={{padding:'var(--space-8)',marginBottom:'var(--space-5)',textAlign:'center',cursor:'pointer',border: dragOver ? '2px dashed var(--accent-blue)' : '2px dashed var(--border-default)',transition:'all 0.2s'}}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} style={{display:'none'}} />
        <div style={{fontSize:'3rem',marginBottom:'var(--space-4)'}}>📄</div>
        <div style={{fontSize:'var(--text-lg)',fontWeight:600,marginBottom:'var(--space-2)'}}>
          {file ? file.name : 'Drop Excel file here or click to browse'}
        </div>
        <div style={{color:'var(--text-tertiary)',fontSize:'var(--text-sm)'}}>
          {file ? `${(file.size / 1024).toFixed(1)} KB — ${file.type || 'Excel'}` : 'Supports .xlsx, .xls, .csv files'}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card" style={{padding:'var(--space-4)',marginBottom:'var(--space-5)',borderColor:'var(--accent-rose)',background:'var(--accent-rose-dim)'}}>
          <span style={{color:'var(--accent-rose-soft)'}}>❌ Error: {error}</span>
        </div>
      )}

      {/* Import Result */}
      {result && (
        <div className="glass-card" style={{padding:'var(--space-5)',marginBottom:'var(--space-5)',borderColor:'var(--accent-emerald)',background:'var(--accent-emerald-dim)'}}>
          <h4 style={{color:'var(--accent-emerald-soft)',marginBottom:'var(--space-3)'}}>✅ Import Successful!</h4>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'var(--space-4)'}}>
            <div><span style={{color:'var(--text-tertiary)'}}>Total Rows</span><br/><strong>{result.totalRows}</strong></div>
            <div><span style={{color:'var(--text-tertiary)'}}>Inserted</span><br/><strong style={{color:'var(--accent-emerald-soft)'}}>{result.insertedCount}</strong></div>
            <div><span style={{color:'var(--text-tertiary)'}}>Duplicates Skipped</span><br/><strong style={{color:'var(--accent-amber-soft)'}}>{result.duplicateCount}</strong></div>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="glass-card" style={{padding:'var(--space-5)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'var(--space-4)'}}>
            <div>
              <h4>Data Preview</h4>
              <p style={{color:'var(--text-tertiary)',fontSize:'var(--text-sm)'}}>
                Sheet: {preview.sheetName} — {preview.rowCount} rows, {preview.columns.length} columns
              </p>
            </div>
            <button onClick={handleImport} disabled={importing}
              style={{padding:'var(--space-3) var(--space-6)',background:'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))',color:'white',border:'none',borderRadius:'var(--radius-md)',fontWeight:600,cursor:'pointer',fontSize:'var(--text-sm)'}}>
              {importing ? '⏳ Importing...' : '📥 Import Now'}
            </button>
          </div>
          <div className="table-container" style={{maxHeight:'400px',overflow:'auto'}}>
            <table className="data-table">
              <thead><tr>{preview.columns.map((c,i) => <th key={i} style={{fontSize:'var(--text-xs)'}}>{c}</th>)}</tr></thead>
              <tbody>
                {preview.sampleRows.map((row, i) => (
                  <tr key={i}>{preview.columns.map((c,j) => <td key={j} style={{fontSize:'var(--text-xs)',maxWidth:'200px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row[c] || '—'}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
