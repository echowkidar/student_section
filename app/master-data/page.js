'use client';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

const CAT_COLORS = { A: { bg: 'var(--accent-blue-dim)', text: 'var(--accent-blue-soft)' }, B: { bg: 'var(--accent-emerald-dim)', text: 'var(--accent-emerald-soft)' }, C: { bg: 'var(--accent-amber-dim)', text: 'var(--accent-amber-soft)' }, D: { bg: 'var(--accent-purple-dim)', text: 'var(--accent-purple-soft)' } };

export default function MasterDataPage() {
  const [tab, setTab] = useState('halls');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Course Group specific state
  const [newGroupName, setNewGroupName] = useState('');
  const [allCourses, setAllCourses] = useState([]);
  const [selectedCourseForGroup, setSelectedCourseForGroup] = useState({});
  const [editingCourse, setEditingCourse] = useState(null);
  const [feeData, setFeeData] = useState(null);
  const [savingFee, setSavingFee] = useState(false);
  const [courseGroups, setCourseGroups] = useState([]);

  // CRUD state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' | 'edit'
  const [formData, setFormData] = useState({});
  const [savingRecord, setSavingRecord] = useState(false);

  useEffect(() => {
    fetch('/api/course-groups').then(r => r.json()).then(setCourseGroups).catch(console.error);
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

  useEffect(() => {
    setLoading(true); setSearch('');
    
    if (tab === 'course_groups') {
      fetch('/api/course-groups')
        .then(r => r.json())
        .then(d => { setData({ data: d }); setLoading(false); })
        .catch(() => setLoading(false));
        
      fetch('/api/master-data?table=admission_courses')
        .then(r => r.json())
        .then(d => setAllCourses(d.data || []));
    } else {
      fetch(`/api/master-data?table=${tab}`)
        .then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
    }
  }, [tab]);

  const tabs = [
    { key: 'halls', label: '🏫 Halls', icon: '🏫' },
    { key: 'heads', label: '📋 Heads of Account', icon: '📋' },
    { key: 'admission_courses', label: '🎓 Admission Courses', icon: '🎓' },
    { key: 'continuation_courses', label: '🔄 Continuation Courses', icon: '🔄' },
    { key: 'course_groups', label: '📁 Course Groups', icon: '📁' }
  ];

  const rows = data?.data || [];
  const filtered = rows.filter(r => {
    if (!search) return true;
    if (tab === 'course_groups') {
      return r.group_name.toLowerCase().includes(search.toLowerCase());
    }
    return Object.values(r).some(v => String(v || '').toLowerCase().includes(search.toLowerCase()));
  });

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await fetch('/api/course-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', group_name: newGroupName })
      });
      const res = await fetch('/api/course-groups');
      const d = await res.json();
      setData({ data: d });
      setCourseGroups(d);
      setNewGroupName('');
    } catch (e) {
      console.error(e);
    }
  };

  const deleteGroup = async (id) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
      await fetch(`/api/course-groups?id=${id}`, { method: 'DELETE' });
      const r = await fetch('/api/course-groups');
      const d = await r.json();
      setData({ data: d });
      setCourseGroups(d);
    } catch (e) {
      console.error(e);
    }
  };

  const updateGroupCourses = async (groupId, newCourses) => {
    try {
      const res = await fetch('/api/course-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_mappings', group_id: groupId, course_codes: newCourses })
      });
      const d = await res.json();
      if (!res.ok || d.error) {
        alert(d.error || 'Failed to update group courses.');
        return;
      }
      const r = await fetch('/api/course-groups');
      const dataJson = await r.json();
      setData({ data: dataJson });
      setCourseGroups(dataJson);
    } catch (e) {
      console.error(e);
      alert('Network error occurred.');
    }
  };

  const addCourseToGroup = (groupId, groupCourses) => {
    const courseToAdd = selectedCourseForGroup[groupId];
    if (!courseToAdd) return;
    if (groupCourses.includes(courseToAdd)) return; // already added
    
    const newCourses = [...groupCourses, courseToAdd];
    updateGroupCourses(groupId, newCourses);
    setSelectedCourseForGroup({ ...selectedCourseForGroup, [groupId]: '' });
  };

  const removeCourseFromGroup = (groupId, groupCourses, courseToRemove) => {
    const newCourses = groupCourses.filter(c => c !== courseToRemove);
    updateGroupCourses(groupId, newCourses);
  };

  const openFeeEdit = async (courseRecord, currentTab) => {
    setEditingCourse({ 
      CLASSCODE: courseRecord.CLASSCODE, 
      CLASS: courseRecord.CLASS, 
      type: currentTab === 'admission_courses' ? 'admission' : 'continuation' 
    });
    setFeeData(null);
    try {
      const res = await fetch(`/api/reports/head-wise?type=${currentTab === 'admission_courses' ? 'admission' : 'continuation'}&course=${courseRecord.CLASSCODE}`);
      const data = await res.json();
      setFeeData(data);
    } catch (e) {
      console.error(e);
      alert('Failed to load fee structure.');
    }
  };

  const handleFeeChange = (rowIndex, headCode, val) => {
    if (!feeData) return;
    const newBreakdown = [...feeData.feeBreakdown];
    newBreakdown[rowIndex][headCode] = val;
    
    // Recalculate totals
    let total = 0;
    let cata = 0, catb = 0, catc = 0, catd = 0;
    feeData.heads.forEach(h => {
      const amt = parseFloat(newBreakdown[rowIndex][h.HEAD_CODE]) || 0;
      total += amt;
      if (h.CATEGORY === 'A') cata += amt;
      else if (h.CATEGORY === 'B') catb += amt;
      else if (h.CATEGORY === 'C') catc += amt;
      else if (h.CATEGORY === 'D') catd += amt;
    });
    newBreakdown[rowIndex].TOT_AMT = total.toFixed(2);
    newBreakdown[rowIndex].CATA = cata.toFixed(2);
    newBreakdown[rowIndex].CATB = catb.toFixed(2);
    newBreakdown[rowIndex].CATC = catc.toFixed(2);
    newBreakdown[rowIndex].CATD = catd.toFixed(2);

    setFeeData({ ...feeData, feeBreakdown: newBreakdown });
  };

  const saveFeeStructure = async () => {
    const groupObj = courseGroups.find(g => g.courses.includes(editingCourse.CLASSCODE));
    setSavingFee(true);
    try {
      const res = await fetch('/api/master-data/edit-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classcode: editingCourse.CLASSCODE,
          type: editingCourse.type,
          feeBreakdown: feeData.feeBreakdown,
          isBulk: !!groupObj,
          groupCourses: groupObj ? groupObj.courses : []
        })
      });
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || 'Failed to save fee');
      alert('Fee structure updated successfully!');
      setEditingCourse(null);
      // Reload main data
      const r = await fetch(`/api/master-data?table=${tab}`);
      const td = await r.json();
      setData({ data: td.data, columns: td.columns });
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setSavingFee(false);
    }
  };

  const openAddModal = () => {
    setModalType('add');
    if (tab === 'halls') setFormData({ name: '', gender: 'Boys', code: '' });
    if (tab === 'heads') setFormData({ HEAD_NAME: '', SHORT_HEAD_NAME: '', HEAD_CODE: '', CATEGORY: 'A' });
    if (tab === 'admission_courses' || tab === 'continuation_courses') setFormData({ CLASSCODE: '', COURSE_O: '', CLASS: '', FACULTY: '', FACNAME: '', DURATION: '2' });
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setModalType('edit');
    if (tab === 'halls') {
      if (record.isGrouped) {
        setFormData({ id: record.ids.join(','), name: record.name, gender: record.gender, code: record.codes.join(', ') });
      } else {
        setFormData({ id: record.id, name: record['Abdullah Hall'], gender: record.Girls, code: record.ABD });
      }
    }
    if (tab === 'heads') setFormData({ ...record });
    setIsModalOpen(true);
  };

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    setSavingRecord(true);
    try {
      const method = modalType === 'add' ? 'POST' : 'PUT';
      // For PUT, we send the identifier as 'id'
      const id = tab === 'halls' ? formData.id : formData.HEAD_CODE;
      
      const res = await fetch('/api/master-data', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: tab, data: formData, id })
      });
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || 'Failed to save record');
      
      // Reload main data
      const r = await fetch(`/api/master-data?table=${tab}`);
      const td = await r.json();
      setData({ data: td.data, columns: td.columns });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSavingRecord(false);
    }
  };

  const handleDeleteRecord = async (record) => {
    const id = tab === 'halls' ? (record.isGrouped ? record.ids.join(',') : record.id) : tab === 'heads' ? record.HEAD_CODE : record.CLASSCODE;
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const res = await fetch(`/api/master-data?table=${tab}&id=${id}`, { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || 'Failed to delete record');
      
      // Reload main data
      const r = await fetch(`/api/master-data?table=${tab}`);
      const td = await r.json();
      setData({ data: td.data, columns: td.columns });
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  if (!authChecked) {
    return (
      <div className="page-header">
        <h1>🔧 Master Data Management</h1>
        <p>Checking access rights...</p>
      </div>
    );
  }

  if (userRole !== 'admin' && userRole !== 'sub admin' && userRole !== 'sub_admin') {
    return (
      <div>
        <div className="page-header">
          <h1>🔧 Master Data Management</h1>
          <p>Manage application lookup data</p>
        </div>
        <div className="glass-card" style={{ padding: 'var(--space-8)', textAlign: 'center', marginTop: 'var(--space-6)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>🚫</div>
          <h2 style={{ color: 'var(--accent-rose)', marginBottom: 'var(--space-4)' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Only Administrators and Sub-Administrators can access the Master Data Management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header"><h1>🔧 Master Data Management</h1><p>View and manage reference data tables</p></div>

      {/* Tabs */}
      <div style={{display:'flex',gap:'2px',background:'var(--bg-surface)',borderRadius:'var(--radius-lg)',padding:'4px',marginBottom:'var(--space-5)',border:'1px solid var(--border-subtle)',flexWrap:'wrap'}}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{padding:'var(--space-3) var(--space-5)',borderRadius:'var(--radius-md)',border:'none',cursor:'pointer',fontWeight:600,fontSize:'var(--text-sm)',background:tab===t.key?'var(--accent-blue)':'transparent',color:tab===t.key?'white':'var(--text-secondary)',transition:'all 0.2s'}}>{t.label}</button>
        ))}
      </div>

      {/* Search and Add */}
      <div className="glass-card" style={{padding:'var(--space-4)',marginBottom:'var(--space-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{display:'flex', gap:'var(--space-4)', alignItems: 'center'}}>
          <div className="search-container" style={{maxWidth:'400px', margin: 0}}>
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder={`Search ${tab}...`} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{fontSize:'var(--text-sm)',color:'var(--text-tertiary)'}}>
            {filtered.length} of {rows.length} records
          </div>
        </div>
        {(tab === 'halls' || tab === 'heads' || tab === 'admission_courses' || tab === 'continuation_courses') && (
          <button onClick={openAddModal} style={{background:'var(--accent-blue)', color:'white', border:'none', padding:'8px 16px', borderRadius:'var(--radius-md)', cursor:'pointer', fontWeight:600}}>
            + Add New Record
          </button>
        )}
      </div>

      {/* Course Groups UI */}
      {tab === 'course_groups' && (
        <div>
          <div style={{display:'flex', gap:'10px', marginBottom: 'var(--space-5)'}}>
            <input 
              className="form-input" 
              style={{maxWidth: '300px'}} 
              placeholder="New Group Name..." 
              value={newGroupName} 
              onChange={e => setNewGroupName(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && createGroup()}
            />
            <button style={{background: 'var(--accent-blue)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontWeight: 600}} onClick={createGroup}>
              Create Group
            </button>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-5)'}}>
            {filtered.map((group, i) => (
              <div key={group.id || i} className="glass-card" style={{padding: 'var(--space-5)'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)'}}>
                  <h3 style={{margin: 0}}>{group.group_name}</h3>
                  <button style={{background: 'var(--accent-rose-dim)', color: 'var(--accent-rose-soft)', border: 'none', padding: '5px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600}} onClick={() => deleteGroup(group.id)}>Delete Group</button>
                </div>
                
                <div style={{marginBottom: 'var(--space-4)'}}>
                  <div style={{fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)'}}>
                    Mapped Courses ({group.courses?.length || 0}):
                  </div>
                  {group.courses?.length > 0 ? (
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                      {group.courses.map(c => {
                        const courseObj = allCourses.find(ac => ac.CLASSCODE === c);
                        const courseName = courseObj ? courseObj.CLASS : c;
                        return (
                          <span key={c} style={{background: 'var(--bg-elevated)', padding: '6px 10px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-subtle)'}}>
                            <span style={{color: 'var(--accent-blue-soft)', fontWeight: 600}}>{c}</span> 
                            <span>{courseName}</span>
                            <button style={{border:'none', background:'transparent', color:'var(--text-muted)', cursor:'pointer', fontSize: '14px', display: 'flex', alignItems: 'center'}} onClick={() => removeCourseFromGroup(group.id, group.courses, c)} title="Remove">×</button>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontStyle: 'italic'}}>No courses mapped yet.</div>
                  )}
                </div>
                
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                   <select 
                     className="form-select" 
                     style={{maxWidth: '500px'}}
                     value={selectedCourseForGroup[group.id] || ''} 
                     onChange={e => setSelectedCourseForGroup({...selectedCourseForGroup, [group.id]: e.target.value})}
                   >
                      <option value="">-- Add Course to Group --</option>
                      {allCourses
                        .filter(c => !group.courses?.includes(c.CLASSCODE))
                        .map((c, i) => (
                        <option key={c.CLASSCODE + '-' + i} value={c.CLASSCODE}>{c.CLASSCODE} - {c.CLASS}</option>
                      ))}
                   </select>
                   <button style={{background: 'var(--accent-emerald)', color: 'white', border: 'none', padding: '8px 15px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600}} onClick={() => addCourseToGroup(group.id, group.courses || [])}>
                     Add Course
                   </button>
                </div>
              </div>
            ))}
            
            {filtered.length === 0 && (
               <div className="table-empty">
                 <div className="table-empty-icon">📁</div>
                 <div className="table-empty-text">No Course Groups Found</div>
                 <div className="table-empty-sub">Create a new group above.</div>
               </div>
            )}
          </div>
        </div>
      )}

      {/* Standard Table for other tabs */}
      {tab !== 'course_groups' && (
      <div className="glass-card">
        <div className="table-container" style={{border:'none'}}>
          {tab === 'halls' && (
            <table className="data-table">
              <thead><tr><th>Hall Name</th><th>Gender</th><th>Hall Code(s)</th><th style={{textAlign:'right'}}>Actions</th></tr></thead>
              <tbody>
                {(() => {
                  const grouped = {};
                  filtered.forEach(r => {
                    const name = r['Abdullah Hall'];
                    if (!grouped[name]) grouped[name] = { name, gender: r.Girls, codes: [], ids: [] };
                    if (!grouped[name].codes.includes(r.ABD)) {
                      grouped[name].codes.push(r.ABD);
                      grouped[name].ids.push(r.id);
                    }
                  });
                  return Object.values(grouped).map((g, i) => (
                    <tr key={i}>
                      <td style={{fontWeight:500}}>{g.name}</td>
                      <td><span style={{padding:'2px 10px',borderRadius:'var(--radius-full)',fontSize:'var(--text-xs)',fontWeight:600,background:g.gender==='Boys'?'var(--accent-blue-dim)':g.gender==='Girls'?'var(--accent-rose-dim)':'var(--bg-hover)',color:g.gender==='Boys'?'var(--accent-blue-soft)':g.gender==='Girls'?'var(--accent-rose-soft)':'var(--text-secondary)'}}>{g.gender}</span></td>
                      <td>
                        {g.codes.map((code, idx) => (
                          <code key={idx} style={{fontSize:'var(--text-xs)',background:'var(--bg-hover)',padding:'2px 8px',borderRadius:'4px', marginRight:'4px'}}>{code}</code>
                        ))}
                      </td>
                      <td style={{textAlign:'right'}}>
                        <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                          <button onClick={() => openEditModal({...g, isGrouped: true})} style={{padding:'4px 8px', fontSize:'var(--text-xs)', borderRadius:'var(--radius-sm)', background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', cursor:'pointer', color:'var(--text-secondary)'}}>✏️ Edit</button>
                          <button onClick={() => handleDeleteRecord({...g, isGrouped: true})} style={{padding:'4px 8px', fontSize:'var(--text-xs)', borderRadius:'var(--radius-sm)', background:'var(--accent-rose-dim)', border:'1px solid transparent', cursor:'pointer', color:'var(--accent-rose-soft)'}}>🗑️ Delete</button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          )}
          {tab === 'heads' && (
            <table className="data-table">
              <thead><tr><th>Head Name</th><th>Short Name</th><th>Head Code</th><th>Category</th><th style={{textAlign:'right'}}>Actions</th></tr></thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i}>
                    <td style={{fontWeight:500}}>{r.HEAD_NAME}</td>
                    <td style={{color:'var(--text-secondary)'}}>{r.SHORT_HEAD_NAME}</td>
                    <td><code style={{fontSize:'var(--text-xs)',background:'var(--bg-hover)',padding:'2px 8px',borderRadius:'4px'}}>{r.HEAD_CODE}</code></td>
                    <td><span style={{padding:'2px 10px',borderRadius:'var(--radius-full)',fontSize:'var(--text-xs)',fontWeight:600,background:CAT_COLORS[r.CATEGORY]?.bg,color:CAT_COLORS[r.CATEGORY]?.text}}>Cat {r.CATEGORY}</span></td>
                    <td style={{textAlign:'right'}}>
                      <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                        <button onClick={() => openEditModal(r)} style={{padding:'4px 8px', fontSize:'var(--text-xs)', borderRadius:'var(--radius-sm)', background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', cursor:'pointer', color:'var(--text-secondary)'}}>✏️ Edit</button>
                        <button onClick={() => handleDeleteRecord(r)} style={{padding:'4px 8px', fontSize:'var(--text-xs)', borderRadius:'var(--radius-sm)', background:'var(--accent-rose-dim)', border:'1px solid transparent', cursor:'pointer', color:'var(--accent-rose-soft)'}}>🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {(tab === 'admission_courses' || tab === 'continuation_courses') && (
            <table className="data-table">
              <thead><tr><th>Course</th><th>Code</th><th>Original Code</th><th>Faculty</th><th>Duration</th><th>Min Fee</th><th>Max Fee</th><th style={{textAlign:'right'}}>Actions</th></tr></thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i}>
                    <td style={{fontWeight:500,maxWidth:'250px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.CLASS}</td>
                    <td><code style={{fontSize:'var(--text-xs)',background:'var(--bg-hover)',padding:'2px 8px',borderRadius:'4px'}}>{r.CLASSCODE}</code></td>
                    <td><code style={{fontSize:'var(--text-xs)',color:'var(--text-tertiary)'}}>{r.COURSE_O}</code></td>
                    <td style={{fontSize:'var(--text-xs)',color:'var(--text-secondary)'}}>{r.FACNAME}</td>
                    <td>{r.DURATION} yr</td>
                    <td>{formatCurrency(r.min_fee)}</td>
                    <td style={{fontWeight:600,color:'var(--accent-emerald-soft)'}}>{formatCurrency(r.max_fee)}</td>
                    <td style={{textAlign:'right'}}>
                      <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                        <button onClick={() => openFeeEdit(r, tab)} style={{padding:'4px 8px', fontSize:'var(--text-xs)', borderRadius:'var(--radius-sm)', background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', cursor:'pointer', color:'var(--text-secondary)'}}>
                          ✏️ Edit Fee
                        </button>
                        <button onClick={() => handleDeleteRecord(r)} style={{padding:'4px 8px', fontSize:'var(--text-xs)', borderRadius:'var(--radius-sm)', background:'var(--accent-rose-dim)', border:'1px solid transparent', cursor:'pointer', color:'var(--accent-rose-soft)'}}>🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      )}
      {/* Fee Edit Modal */}
      {editingCourse && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--space-5)'}}>
          <div className="glass-card" style={{width:'95vw', height:'90vh', display:'flex', flexDirection:'column', background:'var(--bg-base)'}}>
            <div style={{padding:'var(--space-4)', borderBottom:'1px solid var(--border-subtle)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <h2 style={{fontSize:'1.2rem', marginBottom:'4px'}}>Edit Fee Structure: {editingCourse.CLASS} <code style={{fontSize:'1rem', color:'var(--text-secondary)'}}>({editingCourse.CLASSCODE})</code></h2>
                {courseGroups.find(g => g.courses.includes(editingCourse.CLASSCODE)) ? (
                  <div style={{color:'var(--accent-amber-soft)', fontSize:'var(--text-sm)', display:'flex', alignItems:'center', gap:'6px'}}>
                    <span style={{background:'var(--accent-amber-dim)', padding:'2px 6px', borderRadius:'4px', fontSize:'0.7rem', fontWeight:700}}>BULK EDIT</span>
                    This course belongs to a group. Editing this will update <b>all courses</b> in that group simultaneously.
                  </div>
                ) : (
                  <div style={{color:'var(--text-secondary)', fontSize:'var(--text-sm)', display:'flex', alignItems:'center', gap:'6px'}}>
                    <span style={{background:'var(--bg-hover)', padding:'2px 6px', borderRadius:'4px', fontSize:'0.7rem', fontWeight:700}}>SINGLE EDIT</span>
                    This course is not in any group. Changes will only apply to this course.
                  </div>
                )}
              </div>
              <button onClick={() => setEditingCourse(null)} style={{background:'transparent', border:'none', fontSize:'1.5rem', color:'var(--text-muted)', cursor:'pointer'}}>×</button>
            </div>
            
            <div style={{flex:1, overflow:'auto', padding:'var(--space-4)'}}>
              {!feeData ? (
                <div style={{textAlign:'center', padding:'50px', color:'var(--text-secondary)'}}>Loading fee structure...</div>
              ) : feeData.feeBreakdown.length === 0 ? (
                <div style={{textAlign:'center', padding:'50px', color:'var(--text-secondary)'}}>No fee records found for this course.</div>
              ) : (
                <table className="data-table" style={{fontSize:'11px', whiteSpace:'nowrap'}}>
                  <thead style={{position:'sticky', top:0, zIndex:10, background:'var(--bg-elevated)'}}>
                    <tr>
                      <th style={{position:'sticky', left:0, background:'var(--bg-elevated)', zIndex:11}}>R/NR</th>
                      <th style={{position:'sticky', left:'40px', background:'var(--bg-elevated)', zIndex:11}}>I/E</th>
                      <th style={{position:'sticky', left:'80px', background:'var(--bg-elevated)', zIndex:11}}>SEX</th>
                      <th style={{background:'var(--bg-hover)'}}>TOTAL AMT</th>
                      {feeData.heads.map(h => (
                        <th key={h.HEAD_CODE} title={h.HEAD_NAME}>{h.SHORT_HEAD_NAME || h.HEAD_CODE}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {feeData.feeBreakdown.map((row, rowIndex) => (
                      <tr key={`${row.R_NR}-${row.IE}-${row.SEX}-${rowIndex}`}>
                        <td style={{position:'sticky', left:0, background:'var(--bg-base)', fontWeight:700, zIndex:1}}>{row.R_NR === 'R' ? 'Res' : 'Non-Res'}</td>
                        <td style={{position:'sticky', left:'40px', background:'var(--bg-base)', fontWeight:700, zIndex:1}}>{row.IE === 'I' ? 'Int' : 'Ext'}</td>
                        <td style={{position:'sticky', left:'80px', background:'var(--bg-base)', fontWeight:700, zIndex:1}}>{row.SEX}</td>
                        <td style={{background:'var(--bg-hover)', fontWeight:700, color:'var(--accent-emerald-soft)'}}>{formatCurrency(row.TOT_AMT)}</td>
                        {feeData.heads.map(h => (
                          <td key={h.HEAD_CODE} style={{padding:'4px'}}>
                            <input 
                              type="number" 
                              value={row[h.HEAD_CODE] === null ? '' : row[h.HEAD_CODE]}
                              onChange={(e) => handleFeeChange(rowIndex, h.HEAD_CODE, e.target.value)}
                              style={{width:'60px', padding:'4px', background:'var(--bg-input)', border:'1px solid var(--border-subtle)', borderRadius:'3px', color:'var(--text-primary)', fontSize:'11px'}}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{padding:'var(--space-4)', borderTop:'1px solid var(--border-subtle)', display:'flex', justifyContent:'flex-end', gap:'10px', background:'var(--bg-elevated)'}}>
              <button onClick={() => setEditingCourse(null)} style={{padding:'8px 16px', background:'transparent', border:'1px solid var(--border-subtle)', color:'var(--text-primary)', borderRadius:'var(--radius-md)', cursor:'pointer', fontWeight:600}}>Cancel</button>
              <button onClick={saveFeeStructure} disabled={savingFee || !feeData} style={{padding:'8px 16px', background:'var(--accent-blue)', border:'none', color:'white', borderRadius:'var(--radius-md)', cursor:(savingFee || !feeData) ? 'not-allowed' : 'pointer', fontWeight:600}}>
                {savingFee ? 'Saving...' : 'Save Fee Structure'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CRUD Modal */}
      {isModalOpen && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--space-5)'}}>
          <div className="glass-card" style={{width:'500px', maxWidth:'95vw', display:'flex', flexDirection:'column', background:'var(--bg-base)'}}>
            <div style={{padding:'var(--space-4)', borderBottom:'1px solid var(--border-subtle)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h2 style={{fontSize:'1.2rem', margin:0}}>{modalType === 'add' ? 'Add New Record' : 'Edit Record'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{background:'transparent', border:'none', fontSize:'1.5rem', color:'var(--text-muted)', cursor:'pointer'}}>×</button>
            </div>
            
            <form onSubmit={handleSaveRecord} style={{padding:'var(--space-4)', display:'flex', flexDirection:'column', gap:'var(--space-4)'}}>
              {tab === 'halls' && (
                <>
                  <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                    <label style={{fontSize:'var(--text-sm)', fontWeight:600}}>Hall Name</label>
                    <input className="form-input" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Abdullah Hall" />
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                    <label style={{fontSize:'var(--text-sm)', fontWeight:600}}>Gender</label>
                    <select className="form-select" value={formData.gender || 'Boys'} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      <option value="Boys">Boys</option>
                      <option value="Girls">Girls</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                    <label style={{fontSize:'var(--text-sm)', fontWeight:600}}>Hall Code(s) (comma-separated)</label>
                    <input className="form-input" required value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. ABD, AB" />
                  </div>
                </>
              )}

              {tab === 'heads' && (
                <>
                  <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                    <label style={{fontSize:'var(--text-sm)', fontWeight:600}}>Head Name</label>
                    <input className="form-input" required value={formData.HEAD_NAME || ''} onChange={e => setFormData({...formData, HEAD_NAME: e.target.value})} placeholder="e.g. TUITION FEE" />
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                    <label style={{fontSize:'var(--text-sm)', fontWeight:600}}>Short Name</label>
                    <input className="form-input" value={formData.SHORT_HEAD_NAME || ''} onChange={e => setFormData({...formData, SHORT_HEAD_NAME: e.target.value})} placeholder="e.g. TUTION FEE" />
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                    <label style={{fontSize:'var(--text-sm)', fontWeight:600}}>Head Code</label>
                    <input className="form-input" required disabled={modalType === 'edit'} value={formData.HEAD_CODE || ''} onChange={e => setFormData({...formData, HEAD_CODE: e.target.value})} placeholder="e.g. A50002" />
                    {modalType === 'edit' && <span style={{fontSize:'var(--text-xs)', color:'var(--text-muted)'}}>Head Code cannot be edited.</span>}
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                    <label style={{fontSize:'var(--text-sm)', fontWeight:600}}>Category</label>
                    <select className="form-select" value={formData.CATEGORY || 'A'} onChange={e => setFormData({...formData, CATEGORY: e.target.value})}>
                      <option value="A">Category A</option>
                      <option value="B">Category B</option>
                      <option value="C">Category C</option>
                      <option value="D">Category D</option>
                    </select>
                  </div>
                </>
              )}

              {(tab === 'admission_courses' || tab === 'continuation_courses') && (
                <>
                  <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                    <label style={{fontSize:'var(--text-sm)', fontWeight:600}}>Course Code</label>
                    <input className="form-input" required disabled={modalType === 'edit'} value={formData.CLASSCODE || ''} onChange={e => setFormData({...formData, CLASSCODE: e.target.value})} placeholder="e.g. BTCMA" />
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                    <label style={{fontSize:'var(--text-sm)', fontWeight:600}}>Original Course Code</label>
                    <input className="form-input" value={formData.COURSE_O || ''} onChange={e => setFormData({...formData, COURSE_O: e.target.value})} placeholder="e.g. BTCM" />
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                    <label style={{fontSize:'var(--text-sm)', fontWeight:600}}>Course Name</label>
                    <input className="form-input" required value={formData.CLASS || ''} onChange={e => setFormData({...formData, CLASS: e.target.value})} placeholder="e.g. B.Tech (Computer Engg)" />
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)'}}>
                    <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                      <label style={{fontSize:'var(--text-sm)', fontWeight:600}}>Faculty Code</label>
                      <input className="form-input" required value={formData.FACULTY || ''} onChange={e => setFormData({...formData, FACULTY: e.target.value})} placeholder="e.g. E" />
                    </div>
                    <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                      <label style={{fontSize:'var(--text-sm)', fontWeight:600}}>Duration (Years)</label>
                      <input className="form-input" type="number" required value={formData.DURATION || ''} onChange={e => setFormData({...formData, DURATION: e.target.value})} placeholder="e.g. 4" />
                    </div>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                    <label style={{fontSize:'var(--text-sm)', fontWeight:600}}>Faculty Name</label>
                    <input className="form-input" required value={formData.FACNAME || ''} onChange={e => setFormData({...formData, FACNAME: e.target.value})} placeholder="e.g. F/o Engineering" />
                  </div>
                </>
              )}

              <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'var(--space-4)'}}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{padding:'8px 16px', background:'transparent', border:'1px solid var(--border-subtle)', color:'var(--text-primary)', borderRadius:'var(--radius-md)', cursor:'pointer', fontWeight:600}}>Cancel</button>
                <button type="submit" disabled={savingRecord} style={{padding:'8px 16px', background:'var(--accent-blue)', border:'none', color:'white', borderRadius:'var(--radius-md)', cursor:savingRecord ? 'not-allowed' : 'pointer', fontWeight:600}}>
                  {savingRecord ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
