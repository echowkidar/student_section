'use client';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ArcElement);

const COLORS = ['#3b82f6','#10b981','#f59e0b','#f43f5e','#8b5cf6','#06b6d4','#ec4899','#84cc16','#f97316','#14b8a6','#6366f1','#a855f7','#22d3ee','#fbbf24','#fb7185'];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div><div className="page-header"><h1>📈 Analytics</h1><p>Loading analytics data...</p></div></div>;

  const { hourlyDistribution, amountDistribution, topProgrammes, methodTrend, refundAnalysis } = data || {};
  const barOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } } } };

  // Method trend - group by month
  const months = [...new Set((methodTrend||[]).map(m => m.month_year))].sort();
  const methods = [...new Set((methodTrend||[]).map(m => m.method))];
  const methodColors = { upi: '#3b82f6', card: '#10b981', netbanking: '#f59e0b', wallet: '#8b5cf6', emi: '#f43f5e' };

  return (
    <div>
      <div className="page-header"><h1>📈 Analytics & Insights</h1><p>Deep dive into payment patterns and trends</p></div>

      {/* Refund Stats */}
      <div className="stats-grid" style={{marginBottom:'var(--space-5)'}}>
        {(refundAnalysis||[]).map((r, i) => (
          <div key={i} className={`glass-card stat-card ${r.refund_status === 'Refunded' ? 'rose' : 'emerald'}`}>
            <div className={`stat-card-icon ${r.refund_status === 'Refunded' ? 'rose' : 'emerald'}`}>{r.refund_status === 'Refunded' ? '↩️' : '✅'}</div>
            <div className="stat-card-value">{parseInt(r.count).toLocaleString('en-IN')}</div>
            <div className="stat-card-title">{r.refund_status}</div>
            <div className="stat-card-subtitle">{formatCurrency(r.total_amount, true)} total</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-5)',marginBottom:'var(--space-5)'}}>
        {/* Hourly Distribution */}
        <div className="glass-card" style={{padding:'var(--space-6)'}}>
          <h4 style={{marginBottom:'var(--space-4)'}}>Payments by Hour of Day</h4>
          <div style={{height:'280px'}}>
            <Bar data={{
              labels: (hourlyDistribution||[]).map(h => `${h.hour}:00`),
              datasets: [{ data: (hourlyDistribution||[]).map(h => parseInt(h.count)), backgroundColor: COLORS.map(c => c + '99'), borderColor: COLORS, borderWidth: 1, borderRadius: 3 }]
            }} options={barOpts} />
          </div>
        </div>

        {/* Amount Distribution */}
        <div className="glass-card" style={{padding:'var(--space-6)'}}>
          <h4 style={{marginBottom:'var(--space-4)'}}>Payment Amount Distribution</h4>
          <div style={{height:'280px'}}>
            <Bar data={{
              labels: (amountDistribution||[]).map(a => a.amount_range),
              datasets: [{ data: (amountDistribution||[]).map(a => parseInt(a.count)), backgroundColor: 'rgba(168,85,247,0.6)', borderColor: '#a855f7', borderWidth: 1, borderRadius: 3 }]
            }} options={barOpts} />
          </div>
        </div>
      </div>

      {/* Top Programmes */}
      <div className="glass-card" style={{padding:'var(--space-6)',marginBottom:'var(--space-5)'}}>
        <h4 style={{marginBottom:'var(--space-4)'}}>Top 15 Programmes by Collection</h4>
        <div style={{height:'400px'}}>
          <Bar data={{
            labels: (topProgrammes||[]).map(p => p.programme),
            datasets: [{ data: (topProgrammes||[]).map(p => parseFloat(p.total_collected)), backgroundColor: COLORS.map(c => c + '80'), borderColor: COLORS, borderWidth: 1, borderRadius: 4 }]
          }} options={{ ...barOpts, indexAxis: 'y', scales: { ...barOpts.scales, x: { ...barOpts.scales.x, ticks: { ...barOpts.scales.x.ticks, callback: v => formatCurrency(v, true) } } } }} />
        </div>
      </div>

      {/* Method Trend */}
      <div className="glass-card" style={{padding:'var(--space-6)'}}>
        <h4 style={{marginBottom:'var(--space-4)'}}>Payment Method Trend by Month</h4>
        <div style={{height:'300px'}}>
          <Bar data={{
            labels: months,
            datasets: methods.map(m => ({
              label: m?.toUpperCase(),
              data: months.map(mo => {
                const item = (methodTrend||[]).find(t => t.month_year === mo && t.method === m);
                return item ? parseInt(item.count) : 0;
              }),
              backgroundColor: methodColors[m] || '#64748b', borderRadius: 3
            }))
          }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } }, scales: { x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } } } }} />
        </div>
      </div>
    </div>
  );
}
