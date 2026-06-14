'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UserManagementPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({ smtp_enabled: 'false', smtp_email: '', smtp_password: '' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const testConnection = async () => {
    setTestResult('testing');
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) setTestResult('success');
      else setTestResult('error');
    } catch { setTestResult('error'); }
  };

  // Users state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });

  useEffect(() => {
    // Check if admin
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user || data.user.role !== 'admin') {
          router.push('/');
        } else {
          setIsAdmin(true);
          loadSettings();
          loadUsers();
        }
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [router]);

  const loadSettings = async () => {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (data.settings) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
    }
    setLoadingUsers(false);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res1 = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'smtp_enabled', value: settings.smtp_enabled || 'false' }) });
      const res2 = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'smtp_email', value: settings.smtp_email || '' }) });
      const res3 = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'smtp_password', value: settings.smtp_password || '' }) });
      
      if (!res1.ok) throw new Error(await res1.text());
      if (!res2.ok) throw new Error(await res2.text());
      if (!res3.ok) throw new Error(await res3.text());
      
      alert('Settings saved successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to save settings: ' + e.message);
    }
    setSavingSettings(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...newUser })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      loadUsers();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleToggleActive = async (user) => {
    if (!confirm(`Are you sure you want to ${user.is_active ? 'disable' : 'enable'} this user?`)) return;
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: user.id, is_active: !user.is_active })
      });
      loadUsers();
    } catch (e) {}
  };

  const handleRoleDropdownChange = async (user, newRole) => {
    if (newRole === user.role) return;
    
    // Optional: add a quick confirmation if changing to/from admin to prevent accidental clicks
    if (newRole === 'admin' && !confirm(`Are you sure you want to make ${user.name} an Admin?`)) return;
    if (user.role === 'admin' && !confirm(`Are you sure you want to remove Admin rights from ${user.name}?`)) return;

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: user.id, role: newRole })
      });
      loadUsers();
    } catch (e) {
      alert("Failed to update role");
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: user.id })
      });
      loadUsers();
    } catch (e) {}
  };

  if (loading) return <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Loading...</div>;
  if (!isAdmin) return null;

  return (
    <div style={{ paddingBottom: '50px' }}>
      <div className="page-header">
        <h1>👥 User Management</h1>
        <p>Manage application users and system settings</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
        {/* Database */}
        <div className="glass-card" style={{padding:'var(--space-6)'}}>
          <h4 style={{marginBottom:'var(--space-4)'}}>🗄️ Database Connection</h4>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-4)',marginBottom:'var(--space-4)'}}>
            <div><span style={{fontSize:'var(--text-xs)',color:'var(--text-tertiary)'}}>Host</span><br/><code style={{fontSize:'var(--text-sm)',background:'var(--bg-hover)',padding:'4px 10px',borderRadius:'6px'}}>217.217.249.153</code></div>
            <div><span style={{fontSize:'var(--text-xs)',color:'var(--text-tertiary)'}}>Port</span><br/><code style={{fontSize:'var(--text-sm)',background:'var(--bg-hover)',padding:'4px 10px',borderRadius:'6px'}}>5432</code></div>
            <div><span style={{fontSize:'var(--text-xs)',color:'var(--text-tertiary)'}}>Database</span><br/><code style={{fontSize:'var(--text-sm)',background:'var(--bg-hover)',padding:'4px 10px',borderRadius:'6px'}}>postgres</code></div>
            <div><span style={{fontSize:'var(--text-xs)',color:'var(--text-tertiary)'}}>User</span><br/><code style={{fontSize:'var(--text-sm)',background:'var(--bg-hover)',padding:'4px 10px',borderRadius:'6px'}}>postgres</code></div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'var(--space-3)'}}>
            <button onClick={testConnection} style={{padding:'var(--space-2) var(--space-5)',background:'var(--accent-blue)',color:'white',border:'none',borderRadius:'var(--radius-md)',cursor:'pointer',fontWeight:600,fontSize:'var(--text-sm)'}}>
              Test Connection
            </button>
            {testResult === 'testing' && <span style={{color:'var(--accent-amber-soft)',fontSize:'var(--text-sm)'}}>⏳ Testing...</span>}
            {testResult === 'success' && <span style={{color:'var(--accent-emerald-soft)',fontSize:'var(--text-sm)'}}>✅ Connected successfully!</span>}
            {testResult === 'error' && <span style={{color:'var(--accent-rose-soft)',fontSize:'var(--text-sm)'}}>❌ Connection failed</span>}
          </div>
        </div>

        <div className="glass-card" style={{ padding: 'var(--space-4)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>📧 Gmail SMTP Settings</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={settings.smtp_enabled === 'true'}
              onChange={e => setSettings({...settings, smtp_enabled: e.target.checked ? 'true' : 'false'})}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: 600 }}>Enable SMTP Email Features</span>
          </label>
          
          {settings.smtp_enabled === 'true' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: 'var(--text-secondary)' }}>Gmail Email Address</label>
                <input 
                  type="email" 
                  className="form-select" 
                  value={settings.smtp_email || ''}
                  onChange={e => setSettings({...settings, smtp_email: e.target.value})}
                  placeholder="admin@gmail.com"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: 'var(--text-secondary)' }}>Gmail App Password (16 chars)</label>
                <input 
                  type="password" 
                  className="form-select" 
                  value={settings.smtp_password || ''}
                  onChange={e => setSettings({...settings, smtp_password: e.target.value})}
                  placeholder="xxxx xxxx xxxx xxxx"
                />
              </div>
            </>
          )}
          <button 
            onClick={handleSaveSettings}
            disabled={savingSettings}
            style={{ padding: '10px', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}
          >
            {savingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
      </div>

      <div className="glass-card">
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem' }}>Registered Users</h2>
          <button 
            onClick={() => setShowModal(true)}
            style={{ padding: '8px 15px', background: 'var(--accent-emerald)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}
          >
            + Add New User
          </button>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>
                    <select 
                      value={u.role}
                      onChange={(e) => handleRoleDropdownChange(u, e.target.value)}
                      style={{ 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        fontSize: '11px', 
                        fontWeight: 600, 
                        background: u.role === 'admin' ? 'var(--accent-purple-dim)' : 'var(--bg-hover)', 
                        color: u.role === 'admin' ? 'var(--accent-purple-soft)' : 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="user">USER</option>
                      <option value="sub admin">SUB ADMIN</option>
                      <option value="admin">ADMIN</option>
                    </select>
                  </td>
                  <td>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: u.is_active ? 'var(--accent-emerald-dim)' : 'var(--accent-rose-dim)', color: u.is_active ? 'var(--accent-emerald-soft)' : 'var(--accent-rose-soft)' }}>
                      {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleToggleActive(u)} style={{ padding: '4px 8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {u.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => handleDeleteUser(u)} style={{ padding: '4px 8px', background: 'var(--accent-rose-dim)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: 'var(--accent-rose-soft)' }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ width: '400px', background: 'var(--bg-base)', padding: '20px' }}>
            <h2 style={{ marginBottom: '20px' }}>Create New User</h2>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Name</label>
                <input required type="text" className="form-select" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Email</label>
                <input required type="email" className="form-select" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Password</label>
                <input required type="text" className="form-select" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Role</label>
                <select className="form-select" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value="user">User</option>
                  <option value="sub admin">Sub Admin</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
