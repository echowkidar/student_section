'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const reports = [
  { icon: '📑', title: 'Head-wise Summary', desc: 'Generate printable head-wise fee chart for a selected course', color: 'blue' },
  { icon: '💰', title: 'Distributed Collection', desc: 'Generate multi-sheet Controller Office format of total distributed fees', color: 'emerald' },
  { icon: '🏫', title: 'Hall-wise Report', desc: 'Generate hall-wise collection report with student counts', color: 'amber' },
  { icon: '🎓', title: 'Course-wise Fee Chart', desc: 'Print fee chart per course with R/NR × Boys/Girls breakdown', color: 'purple' },
  { icon: '🧾', title: 'Payment Receipt', desc: 'Generate individual student fee receipt by payment ID', color: 'cyan' },
  { icon: '📋', title: 'Custom Report', desc: 'Build a custom report by selecting dimensions and filters', color: 'rose' },
];

export default function PrintReportsPage() {
  const [selected, setSelected] = useState(null);

  const router = useRouter();

  const handleGenerate = (title) => {
    if (title === 'Head-wise Summary') {
      router.push('/print-reports/head-wise');
    } else if (title === 'Distributed Collection') {
      router.push('/print-reports/distributed-collection');
    } else if (title === 'Hall-wise Report') {
      router.push('/print-reports/hall-wise');
    } else if (title === 'Course-wise Fee Chart') {
      router.push('/print-reports/course-wise');
    } else if (title === 'Payment Receipt') {
      router.push('/print-reports/payment-receipt');
    } else if (title === 'Custom Report') {
      router.push('/print-reports/custom');
    }
  };

  return (
    <div>
      <div className="page-header"><h1>📄 Print Reports & Exports</h1><p>Generate print-ready reports and export data</p></div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(350px,1fr))',gap:'var(--space-5)'}}>
        {reports.map((r, i) => (
          <div key={i} className="glass-card" style={{padding:'var(--space-6)',cursor:'pointer',transition:'all 0.3s'}} onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform='none'}>
            <div style={{display:'flex',alignItems:'flex-start',gap:'var(--space-4)',marginBottom:'var(--space-4)'}}>
              <div className={`stat-card-icon ${r.color}`} style={{fontSize:'var(--text-2xl)'}}>{r.icon}</div>
              <div>
                <h4 style={{marginBottom:'var(--space-1)'}}>{r.title}</h4>
                <p style={{fontSize:'var(--text-sm)',color:'var(--text-tertiary)',lineHeight:'1.5'}}>{r.desc}</p>
              </div>
            </div>
            <button onClick={() => handleGenerate(r.title)} style={{width:'100%',padding:'var(--space-3)',background:`var(--accent-${r.color}-dim)`,color:`var(--accent-${r.color}-soft)`,border:`1px solid var(--accent-${r.color}-dim)`,borderRadius:'var(--radius-md)',cursor:'pointer',fontWeight:600,fontSize:'var(--text-sm)',transition:'all 0.2s'}}>
              Generate Report →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
