'use client';
import { useState, useEffect } from 'react';
import { formatCurrency, formatDate, getMethodIcon } from '@/lib/utils';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

const COLORS = ['#3b82f6','#10b981','#f59e0b','#f43f5e','#8b5cf6','#06b6d4','#ec4899','#84cc16','#f97316','#14b8a6'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div>
      <div className="page-header"><h1>📊 Dashboard</h1><p>Loading dashboard data...</p></div>
      <div className="stats-grid">
        {[1,2,3,4].map(i => <div key={i} className="glass-card stat-card"><div className="loading-skeleton" style={{height:'80px',borderRadius:'8px'}}></div></div>)}
      </div>
    </div>
  );

  if (error) return (
    <div>
      <div className="page-header"><h1>📊 Dashboard</h1></div>
      <div className="glass-card" style={{padding:'var(--space-8)',textAlign:'center'}}>
        <p style={{color:'var(--accent-rose)',marginBottom:'var(--space-4)'}}>Error: {error}</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    </div>
  );

  const { summary, paymentTypes, paymentMethods, monthlyTrend, residentialBreakdown, recentPayments } = data;

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } }
  };

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#94a3b8', font: { size: 10 }, callback: v => formatCurrency(v, true) }, grid: { color: 'rgba(255,255,255,0.04)' } }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>📊 Dashboard</h1>
        <p>Student Fee Management System — Overview</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{marginBottom:'var(--space-6)'}}>
        <div className="glass-card stat-card blue">
          <div className="stat-card-header">
            <div className="stat-card-icon blue">💰</div>
          </div>
          <div className="stat-card-value">{formatCurrency(summary.total_amount, true)}</div>
          <div className="stat-card-title">Total Collection</div>
          <div className="stat-card-subtitle">{formatCurrency(summary.total_amount)}</div>
        </div>

        <div className="glass-card stat-card emerald">
          <div className="stat-card-header">
            <div className="stat-card-icon emerald">📋</div>
          </div>
          <div className="stat-card-value">{parseInt(summary.total_count).toLocaleString('en-IN')}</div>
          <div className="stat-card-title">Total Transactions</div>
          <div className="stat-card-subtitle">All captured payments</div>
        </div>

        <div className="glass-card stat-card amber">
          <div className="stat-card-header">
            <div className="stat-card-icon amber">📊</div>
          </div>
          <div className="stat-card-value">{formatCurrency(summary.avg_amount, true)}</div>
          <div className="stat-card-title">Average Payment</div>
          <div className="stat-card-subtitle">Per transaction</div>
        </div>

        <div className="glass-card stat-card rose">
          <div className="stat-card-header">
            <div className="stat-card-icon rose">🏆</div>
          </div>
          <div className="stat-card-value">{formatCurrency(summary.max_amount, true)}</div>
          <div className="stat-card-title">Highest Payment</div>
          <div className="stat-card-subtitle">Single transaction max</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-5)',marginBottom:'var(--space-6)'}}>
        <div className="glass-card" style={{padding:'var(--space-6)'}}>
          <h4 style={{marginBottom:'var(--space-4)'}}>Payment Type Distribution</h4>
          <div style={{height:'280px'}}>
            <Doughnut data={{
              labels: paymentTypes.slice(0,8).map(t => t.payment_type || 'Other'),
              datasets: [{
                data: paymentTypes.slice(0,8).map(t => parseInt(t.count)),
                backgroundColor: COLORS.slice(0,8), borderColor: '#0a0a0f', borderWidth: 2
              }]
            }} options={chartOptions} />
          </div>
        </div>

        <div className="glass-card" style={{padding:'var(--space-6)'}}>
          <h4 style={{marginBottom:'var(--space-4)'}}>Payment Methods</h4>
          <div style={{height:'280px'}}>
            <Doughnut data={{
              labels: paymentMethods.map(m => `${getMethodIcon(m.method)} ${m.method?.toUpperCase()}`),
              datasets: [{
                data: paymentMethods.map(m => parseInt(m.count)),
                backgroundColor: ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#f43f5e'], borderColor: '#0a0a0f', borderWidth: 2
              }]
            }} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="glass-card" style={{padding:'var(--space-6)',marginBottom:'var(--space-6)'}}>
        <h4 style={{marginBottom:'var(--space-4)'}}>Monthly Collection Trend</h4>
        <div style={{height:'300px'}}>
          <Bar data={{
            labels: monthlyTrend.map(m => m.month_year),
            datasets: [{
              label: 'Collection',
              data: monthlyTrend.map(m => parseFloat(m.total)),
              backgroundColor: 'rgba(59,130,246,0.6)', borderColor: '#3b82f6',
              borderWidth: 1, borderRadius: 6
            }]
          }} options={barOptions} />
        </div>
      </div>

      {/* Residential + Recent Payments */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'var(--space-5)'}}>
        <div className="glass-card" style={{padding:'var(--space-6)'}}>
          <h4 style={{marginBottom:'var(--space-4)'}}>Residential Status</h4>
          <div style={{height:'250px'}}>
            <Doughnut data={{
              labels: residentialBreakdown.map(r => r.status),
              datasets: [{
                data: residentialBreakdown.map(r => parseInt(r.count)),
                backgroundColor: ['#10b981','#f59e0b','#64748b'], borderColor: '#0a0a0f', borderWidth: 2
              }]
            }} options={chartOptions} />
          </div>
        </div>

        <div className="glass-card" style={{padding:'var(--space-6)'}}>
          <h4 style={{marginBottom:'var(--space-4)'}}>Recent Payments</h4>
          <div className="table-container" style={{border:'none'}}>
            <table className="data-table">
              <thead><tr>
                <th>Date</th><th>Student</th><th>Type</th><th>Amount</th><th>Method</th>
              </tr></thead>
              <tbody>
                {recentPayments.map((p, i) => (
                  <tr key={i}>
                    <td style={{fontSize:'var(--text-xs)'}}>{formatDate(p.created_at)}</td>
                    <td>{p.student_name || '—'}</td>
                    <td><span className="badge info" style={{fontSize:'var(--text-xs)'}}>{p.payment_type}</span></td>
                    <td style={{fontWeight:600}}>{formatCurrency(p.amount)}</td>
                    <td>{getMethodIcon(p.method)} {p.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
