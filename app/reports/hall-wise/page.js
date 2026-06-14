'use client';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function HallWiseReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/hall-wise').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div><div className="page-header"><h1>🏫 Hall Reports</h1><p>Loading...</p></div></div>;

  const halls = data?.hallMaster || [];
  const collection = data?.hallCollection || [];
  const genderSummary = data?.genderSummary || [];

  // Map hall codes to names
  const hallMap = {};
  halls.forEach(h => { hallMap[h.ABD] = { name: h['Abdullah Hall'], gender: h.Girls }; });

  const top15 = collection.slice(0, 15);

  return (
    <div>
      <div className="page-header"><h1>🏫 Hall-wise Reports</h1><p>Collection analysis by halls of residence</p></div>

      <div className="stats-grid" style={{marginBottom:'var(--space-5)'}}>
        <div className="glass-card stat-card blue"><div className="stat-card-icon blue">🏛️</div><div className="stat-card-value">{halls.length}</div><div className="stat-card-title">Total Halls</div></div>
        <div className="glass-card stat-card cyan"><div className="stat-card-icon cyan">👦</div><div className="stat-card-value">{halls.filter(h => h.Girls === 'Boys').length}</div><div className="stat-card-title">Boys Halls</div></div>
        <div className="glass-card stat-card rose"><div className="stat-card-icon rose">👧</div><div className="stat-card-value">{halls.filter(h => h.Girls === 'Girls').length}</div><div className="stat-card-title">Girls Halls</div></div>
        <div className="glass-card stat-card emerald"><div className="stat-card-icon emerald">💰</div><div className="stat-card-value">{formatCurrency(collection.reduce((s, c) => s + parseFloat(c.total_collected || 0), 0), true)}</div><div className="stat-card-title">Total Hall Collection</div></div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'var(--space-5)',marginBottom:'var(--space-5)'}}>
        <div className="glass-card" style={{padding:'var(--space-6)'}}>
          <h4 style={{marginBottom:'var(--space-4)'}}>Top Halls by Collection</h4>
          <div style={{height:'350px'}}>
            <Bar data={{
              labels: top15.map(c => hallMap[c.hall_code]?.name || c.hall_code),
              datasets: [{ data: top15.map(c => parseFloat(c.total_collected)), backgroundColor: 'rgba(59,130,246,0.6)', borderColor: '#3b82f6', borderWidth: 1, borderRadius: 4 }]
            }} options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#94a3b8', callback: v => formatCurrency(v, true) }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } } } }} />
          </div>
        </div>
        <div className="glass-card" style={{padding:'var(--space-6)'}}>
          <h4 style={{marginBottom:'var(--space-4)'}}>Boys vs Girls</h4>
          <div style={{height:'350px'}}>
            <Doughnut data={{
              labels: genderSummary.map(g => g.gender || 'Unknown'),
              datasets: [{ data: genderSummary.map(g => parseFloat(g.total_collected || 0)), backgroundColor: ['#3b82f6', '#f43f5e', '#64748b'], borderColor: '#0a0a0f', borderWidth: 2 }]
            }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } } }} />
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div style={{padding:'var(--space-5) var(--space-5) 0'}}><h4>Hall-wise Collection Details</h4></div>
        <div className="table-container" style={{border:'none'}}>
          <table className="data-table">
            <thead><tr><th>Hall Name</th><th>Code</th><th>Gender</th><th>Students</th><th>Total Collected</th></tr></thead>
            <tbody>
              {collection.map(c => (
                <tr key={c.hall_code}>
                  <td style={{fontWeight:500}}>{hallMap[c.hall_code]?.name || c.hall_code}</td>
                  <td><code style={{fontSize:'var(--text-xs)',background:'var(--bg-hover)',padding:'2px 6px',borderRadius:'4px'}}>{c.hall_code}</code></td>
                  <td><span style={{padding:'2px 8px',borderRadius:'var(--radius-full)',fontSize:'var(--text-xs)',fontWeight:600, background: hallMap[c.hall_code]?.gender === 'Boys' ? 'var(--accent-blue-dim)' : hallMap[c.hall_code]?.gender === 'Girls' ? 'var(--accent-rose-dim)' : 'var(--bg-hover)', color: hallMap[c.hall_code]?.gender === 'Boys' ? 'var(--accent-blue-soft)' : hallMap[c.hall_code]?.gender === 'Girls' ? 'var(--accent-rose-soft)' : 'var(--text-secondary)'}}>{hallMap[c.hall_code]?.gender || '—'}</span></td>
                  <td>{parseInt(c.student_count).toLocaleString('en-IN')}</td>
                  <td style={{fontWeight:600,color:'var(--accent-emerald-soft)'}}>{formatCurrency(c.total_collected)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
