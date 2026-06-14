'use client';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function CourseWiseReports() {
  const [type, setType] = useState('admission');
  const [faculty, setFaculty] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/course-wise?type=${type}&faculty=${faculty}`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [type, faculty]);

  const courses = data?.courses || [];
  const faculties = data?.faculties || [];
  const facultySummary = data?.facultySummary || [];
  const collection = data?.collection || [];

  const top10 = collection.filter(c => c.payment_type?.includes('Admission') || c.payment_type?.includes('Continuation')).slice(0, 10);

  return (
    <div>
      <div className="page-header"><h1>🎓 Course & Faculty Reports</h1><p>Course-wise fee structures and collection analysis</p></div>

      <div className="glass-card" style={{padding:'var(--space-4)',marginBottom:'var(--space-5)'}}>
        <div className="filter-bar">
          <div style={{display:'flex',gap:'2px',background:'var(--bg-input)',borderRadius:'var(--radius-md)',padding:'2px'}}>
            <button onClick={() => { setType('admission'); setFaculty(''); }} style={{padding:'var(--space-2) var(--space-5)',borderRadius:'var(--radius-md)',border:'none',cursor:'pointer',fontWeight:600,fontSize:'var(--text-sm)',background:type==='admission'?'var(--accent-blue)':'transparent',color:type==='admission'?'white':'var(--text-secondary)'}}>Admission</button>
            <button onClick={() => { setType('continuation'); setFaculty(''); }} style={{padding:'var(--space-2) var(--space-5)',borderRadius:'var(--radius-md)',border:'none',cursor:'pointer',fontWeight:600,fontSize:'var(--text-sm)',background:type==='continuation'?'var(--accent-emerald)':'transparent',color:type==='continuation'?'white':'var(--text-secondary)'}}>Continuation</button>
          </div>
          <select className="form-select" style={{maxWidth:'300px'}} value={faculty} onChange={e => setFaculty(e.target.value)}>
            <option value="">All Faculties</option>
            {faculties.map(f => <option key={f.FACULTY} value={f.FACULTY}>{f.FACNAME}</option>)}
          </select>
        </div>
      </div>

      {/* Faculty Summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'var(--space-4)',marginBottom:'var(--space-5)'}}>
        {facultySummary.slice(0, 12).map((f, i) => (
          <div key={i} className="glass-card" style={{padding:'var(--space-5)',cursor:'pointer'}} onClick={() => setFaculty(f.faculty_code)}>
            <div style={{fontSize:'var(--text-sm)',fontWeight:600,marginBottom:'var(--space-2)',color:'var(--text-primary)'}}>{f.faculty_name}</div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'var(--text-xs)',color:'var(--text-tertiary)'}}>
              <span>{f.course_count} courses</span>
              <span>{formatCurrency(f.min_fee, true)} — {formatCurrency(f.max_fee, true)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Programmes Chart */}
      {top10.length > 0 && (
        <div className="glass-card" style={{padding:'var(--space-6)',marginBottom:'var(--space-5)'}}>
          <h4 style={{marginBottom:'var(--space-4)'}}>Top Programmes by Collection</h4>
          <div style={{height:'300px'}}>
            <Bar data={{
              labels: top10.map(c => c.programme_code || 'Unknown'),
              datasets: [{ data: top10.map(c => parseFloat(c.total_collected)), backgroundColor: 'rgba(16,185,129,0.6)', borderColor: '#10b981', borderWidth: 1, borderRadius: 4 }]
            }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { ticks: { color: '#94a3b8', callback: v => formatCurrency(v, true) }, grid: { color: 'rgba(255,255,255,0.04)' } } } }} />
          </div>
        </div>
      )}

      {/* Courses Table */}
      <div className="glass-card">
        <div style={{padding:'var(--space-5) var(--space-5) 0'}}><h4>Courses ({courses.length})</h4></div>
        <div className="table-container" style={{border:'none'}}>
          <table className="data-table">
            <thead><tr><th>Course</th><th>Code</th><th>Faculty</th><th>Duration</th><th>Min Fee</th><th>Max Fee</th></tr></thead>
            <tbody>
              {courses.map((c, i) => (
                <tr key={i}>
                  <td style={{fontWeight:500,maxWidth:'300px'}}>{c.CLASS}</td>
                  <td><code style={{fontSize:'var(--text-xs)',background:'var(--bg-hover)',padding:'2px 6px',borderRadius:'4px'}}>{c.CLASSCODE}</code></td>
                  <td style={{color:'var(--text-secondary)',fontSize:'var(--text-xs)'}}>{c.FACNAME}</td>
                  <td>{c.DURATION} yr</td>
                  <td>{formatCurrency(c.min_fee)}</td>
                  <td style={{fontWeight:600,color:'var(--accent-emerald-soft)'}}>{formatCurrency(c.max_fee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
