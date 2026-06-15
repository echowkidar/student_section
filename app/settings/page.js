'use client';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [dateFormat, setDateFormat] = useState('dd/mm/yyyy');
  const [numberFormat, setNumberFormat] = useState('indian');
  const [academicYear, setAcademicYear] = useState('2025-26');
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Fetch settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setRegistrationEnabled(data.settings.registration_enabled !== 'false');
        }
      });
      
    // Fetch user role
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUserRole(data.user.role);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const isAdmin = userRole === 'admin' || userRole === 'sub_admin';

  const handleToggleRegistration = async (newValue) => {
    if (!isAdmin) return;
    setRegistrationEnabled(newValue);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'registration_enabled', value: newValue ? 'true' : 'false' }),
      });
    } catch (error) {
      console.error('Failed to save setting');
    }
  };

  return (
    <div>
      <div className="page-header"><h1>⚙️ Settings</h1><p>Configure system preferences</p></div>

      <div style={{display:'grid',gap:'var(--space-5)',maxWidth:'800px'}}>
        {/* Security & Access */}
        <div className="glass-card" style={{padding:'var(--space-6)', opacity: isAdmin ? 1 : 0.6}}>
          <h4 style={{marginBottom:'var(--space-4)'}}>🔒 Security & Access</h4>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:500}}>User Registration</div>
              <div style={{fontSize:'var(--text-xs)',color:'var(--text-tertiary)'}}>Allow new users to register on the platform</div>
            </div>
            <div style={{display:'flex',gap:'2px',background:'var(--bg-input)',borderRadius:'var(--radius-md)',padding:'2px'}}>
              <button disabled={loading || !isAdmin} onClick={() => handleToggleRegistration(true)} style={{padding:'var(--space-1) var(--space-3)',borderRadius:'6px',border:'none',cursor:isAdmin?'pointer':'not-allowed',fontSize:'var(--text-xs)',fontWeight:600,background:registrationEnabled?'var(--accent-blue)':'transparent',color:registrationEnabled?'white':'var(--text-secondary)'}}>ON</button>
              <button disabled={loading || !isAdmin} onClick={() => handleToggleRegistration(false)} style={{padding:'var(--space-1) var(--space-3)',borderRadius:'6px',border:'none',cursor:isAdmin?'pointer':'not-allowed',fontSize:'var(--text-xs)',fontWeight:600,background:!registrationEnabled?'var(--accent-rose)':'transparent',color:!registrationEnabled?'white':'var(--text-secondary)'}}>OFF</button>
            </div>
          </div>
        </div>

        {/* Academic Year */}
        <div className="glass-card" style={{padding:'var(--space-6)', opacity: isAdmin ? 1 : 0.6}}>
          <h4 style={{marginBottom:'var(--space-4)'}}>📅 Academic Year</h4>
          <select disabled={!isAdmin} className="form-select" style={{maxWidth:'200px', cursor:isAdmin?'pointer':'not-allowed'}} value={academicYear} onChange={e => { if(isAdmin) setAcademicYear(e.target.value); }}>
            <option value="2025-26">2025-26</option>
            <option value="2024-25">2024-25</option>
            <option value="2023-24">2023-24</option>
          </select>
        </div>

        {/* Display */}
        <div className="glass-card" style={{padding:'var(--space-6)', opacity: isAdmin ? 1 : 0.6}}>
          <h4 style={{marginBottom:'var(--space-4)'}}>🎨 Display Settings</h4>
          <div style={{display:'grid',gap:'var(--space-4)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><div style={{fontWeight:500}}>Date Format</div><div style={{fontSize:'var(--text-xs)',color:'var(--text-tertiary)'}}>Choose how dates are displayed</div></div>
              <div style={{display:'flex',gap:'2px',background:'var(--bg-input)',borderRadius:'var(--radius-md)',padding:'2px'}}>
                <button disabled={!isAdmin} onClick={() => { if(isAdmin) setDateFormat('dd/mm/yyyy'); }} style={{padding:'var(--space-1) var(--space-3)',borderRadius:'6px',border:'none',cursor:isAdmin?'pointer':'not-allowed',fontSize:'var(--text-xs)',fontWeight:600,background:dateFormat==='dd/mm/yyyy'?'var(--accent-blue)':'transparent',color:dateFormat==='dd/mm/yyyy'?'white':'var(--text-secondary)'}}>DD/MM/YYYY</button>
                <button disabled={!isAdmin} onClick={() => { if(isAdmin) setDateFormat('mm/dd/yyyy'); }} style={{padding:'var(--space-1) var(--space-3)',borderRadius:'6px',border:'none',cursor:isAdmin?'pointer':'not-allowed',fontSize:'var(--text-xs)',fontWeight:600,background:dateFormat==='mm/dd/yyyy'?'var(--accent-blue)':'transparent',color:dateFormat==='mm/dd/yyyy'?'white':'var(--text-secondary)'}}>MM/DD/YYYY</button>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><div style={{fontWeight:500}}>Number Format</div><div style={{fontSize:'var(--text-xs)',color:'var(--text-tertiary)'}}>Indian (12,34,567) or International (1,234,567)</div></div>
              <div style={{display:'flex',gap:'2px',background:'var(--bg-input)',borderRadius:'var(--radius-md)',padding:'2px'}}>
                <button disabled={!isAdmin} onClick={() => { if(isAdmin) setNumberFormat('indian'); }} style={{padding:'var(--space-1) var(--space-3)',borderRadius:'6px',border:'none',cursor:isAdmin?'pointer':'not-allowed',fontSize:'var(--text-xs)',fontWeight:600,background:numberFormat==='indian'?'var(--accent-blue)':'transparent',color:numberFormat==='indian'?'white':'var(--text-secondary)'}}>Indian</button>
                <button disabled={!isAdmin} onClick={() => { if(isAdmin) setNumberFormat('intl'); }} style={{padding:'var(--space-1) var(--space-3)',borderRadius:'6px',border:'none',cursor:isAdmin?'pointer':'not-allowed',fontSize:'var(--text-xs)',fontWeight:600,background:numberFormat==='intl'?'var(--accent-blue)':'transparent',color:numberFormat==='intl'?'white':'var(--text-secondary)'}}>International</button>
              </div>
            </div>
          </div>
        </div>

        {/* Backup */}
        <div className="glass-card" style={{padding:'var(--space-6)'}}>
          <h4 style={{marginBottom:'var(--space-4)'}}>💾 Data Backup</h4>
          <p style={{fontSize:'var(--text-sm)',color:'var(--text-tertiary)',marginBottom:'var(--space-4)'}}>Create a snapshot of the current database for recovery purposes.</p>
          <button onClick={() => alert('Database backup feature coming soon!')} style={{padding:'var(--space-3) var(--space-5)',background:'var(--accent-emerald-dim)',color:'var(--accent-emerald-soft)',border:'1px solid var(--accent-emerald-dim)',borderRadius:'var(--radius-md)',cursor:'pointer',fontWeight:600,fontSize:'var(--text-sm)'}}>
            Create Backup
          </button>
        </div>

        {/* About */}
        <div className="glass-card" style={{padding:'var(--space-6)'}}>
          <h4 style={{marginBottom:'var(--space-4)'}}>ℹ️ About</h4>
          <div style={{fontSize:'var(--text-sm)',color:'var(--text-secondary)',lineHeight:'2'}}>
            <div><strong>Application:</strong> Student Fee Management System</div>
            <div><strong>Purpose:</strong> Track and analyse student fee payments for AMU</div>
            <div><strong>Version:</strong> 1.0.0</div>            
            <div><strong>Developer:</strong> Zafar Ali Khan - Dedicated to AMU</div>
          </div>
        </div>
      </div>
    </div>
  );
}
