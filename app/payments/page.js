'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { formatCurrency, formatDate, getMethodIcon, debounce } from '@/lib/utils';

export default function PaymentsPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ type: '', method: '', residential: '', courseCode: '', courseName: '' });
  const [courseInput, setCourseInput] = useState({ code: '', name: '' });
  const [courses, setCourses] = useState([]);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const courseDropdownRef = useRef(null);
  
  // Column Resizing State
  const [colWidths, setColWidths] = useState({});
  const resizingCol = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = (e, colKey) => {
    e.preventDefault();
    e.stopPropagation();
    resizingCol.current = colKey;
    startX.current = e.clientX;
    const th = e.target.closest('th');
    startWidth.current = th.offsetWidth;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e) => {
    if (!resizingCol.current) return;
    const diff = e.clientX - startX.current;
    const newWidth = Math.max(50, startWidth.current + diff);
    setColWidths((prev) => ({ ...prev, [resizingCol.current]: newWidth }));
  }, []);

  const handleMouseUp = useCallback(() => {
    resizingCol.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const [sort, setSort] = useState({ column: 'created_at', order: 'desc' });
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchData = useCallback(async (page = 1, searchTerm = '', f = filters, s = sort) => {
    setLoading(true);
    const params = new URLSearchParams({ 
      page, limit: 50, search: searchTerm, 
      type: f.type, method: f.method, residential: f.residential, 
      courseCode: f.courseCode, courseName: f.courseName,
      sortBy: s.column, order: s.order 
    });
    try {
      const res = await fetch(`/api/payments?${params}`);
      const json = await res.json();
      setData(json.data || []);
      setPagination(json.pagination || { page: 1, total: 0, totalPages: 0 });
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [filters, sort]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target)) {
        setShowCourseDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { 
    fetchData(1, search, filters, sort); 
    fetch('/api/courses').then(r => r.json()).then(setCourses).catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.courseName !== courseInput.name || filters.courseCode !== courseInput.code) {
        const newFilters = { ...filters, courseName: courseInput.name, courseCode: courseInput.code };
        setFilters(newFilters);
        fetchData(1, search, newFilters, sort);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [courseInput.name, courseInput.code]);

  const debouncedSearch = useCallback(debounce((term) => fetchData(1, term, filters, sort), 400), [filters, sort]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchData(1, search, newFilters, sort);
  };

  const handleSort = (column) => {
    const isAsc = sort.column === column && sort.order === 'asc';
    const newSort = { column, order: isAsc ? 'desc' : 'asc' };
    setSort(newSort);
    fetchData(1, search, filters, newSort);
  };

  const clearFilters = () => {
    setSearch(''); 
    const emptyFilters = { type: '', method: '', residential: '', courseCode: '', courseName: '' };
    setFilters(emptyFilters);
    setCourseInput({ code: '', name: '' });
    fetchData(1, '', emptyFilters, sort);
  };

  const SortIcon = ({ column }) => {
    if (sort.column !== column) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
    return <span style={{ marginLeft: '4px', color: 'var(--accent-blue)' }}>{sort.order === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>💳 Payment Records</h1>
        <p>Search, filter, and explore all payment transactions</p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{padding:'var(--space-4)',marginBottom:'var(--space-5)'}}>
        <div className="filter-bar">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search name, roll no, email, phone, payment ID..." value={search} onChange={handleSearch} />
          </div>
          <select className="form-select" style={{maxWidth:'200px'}} value={filters.type} onChange={e => handleFilter('type', e.target.value)}>
            <option value="">All Types</option>
            <option value="Admission Form Fee">Admission Form Fee</option>
            <option value="Continuation Fee">Continuation Fee</option>
            <option value="Examination Fee">Examination Fee</option>
            <option value="Previous Dues">Previous Dues</option>
            <option value="Employment Form Fee">Employment Form Fee</option>
            <option value="Outstanding Dues">Outstanding Dues</option>
            <option value="Late Fee Fine">Late Fee Fine</option>
            <option value="Admisson Fee">Admission Fee</option>
            <option value="Discrepancy Fee">Discrepancy Fee</option>
          </select>
          <select className="form-select" style={{maxWidth:'160px'}} value={filters.method} onChange={e => handleFilter('method', e.target.value)}>
            <option value="">All Methods</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="netbanking">Net Banking</option>
            <option value="wallet">Wallet</option>
          </select>
          <select className="form-select" style={{maxWidth:'160px'}} value={filters.residential} onChange={e => handleFilter('residential', e.target.value)}>
            <option value="">All Status</option>
            <option value="R">Resident</option>
            <option value="NR">Non-Resident</option>
          </select>
          <div style={{ position: 'relative' }} ref={courseDropdownRef}>
            <input 
              className="form-input" 
              style={{maxWidth:'200px'}} 
              placeholder="Search Course..." 
              value={courseInput.code || courseInput.name} 
              onFocus={() => setShowCourseDropdown(true)}
              onChange={e => {
                setCourseInput({ code: '', name: e.target.value });
                setShowCourseDropdown(true);
              }} 
            />
            {showCourseDropdown && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, zIndex: 99999, width: '300px',
                maxHeight: '350px', overflowY: 'auto', 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border-default)', 
                borderRadius: 'var(--radius-md)', 
                boxShadow: '0 4px 24px rgba(0,0,0,0.8)',
                marginTop: '4px',
                padding: '4px'
              }}>
                {courses.filter(c => (c.name + ' ' + c.code).toLowerCase().includes((courseInput.code || courseInput.name).toLowerCase())).length === 0 ? (
                  <div style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No matches found</div>
                ) : (
                  courses.filter(c => (c.name + ' ' + c.code).toLowerCase().includes((courseInput.code || courseInput.name).toLowerCase())).map(c => (
                    <div 
                      key={c.code}
                      onClick={() => {
                        setCourseInput({ code: c.code, name: '' });
                        setShowCourseDropdown(false);
                      }}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontWeight: 600 }}>{c.code}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button className="btn btn-ghost" onClick={clearFilters} style={{padding:'var(--space-3) var(--space-4)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-md)',background:'transparent',color:'var(--text-secondary)',cursor:'pointer',fontSize:'var(--text-sm)'}}>Clear</button>
        </div>
        <div style={{fontSize:'var(--text-sm)',color:'var(--text-secondary)',marginTop:'var(--space-2)', display:'flex', alignItems:'center', gap:'var(--space-2)'}}>
          <span>Showing {data.length} of {pagination.total?.toLocaleString('en-IN')} records</span>
          {pagination.totalAmount > 0 && (
            <>
              <span style={{color:'var(--border-subtle)'}}>|</span>
              <span style={{fontWeight:500, color:'var(--text-primary)'}}>Total Amount: {formatCurrency(pagination.totalAmount)}</span>
            </>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card">
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ whiteSpace: 'nowrap' }}>
            <thead><tr>
              {[
                { key: 'created_at', label: 'Date' },
                { key: 'student_name', label: 'Student Name' },
                { key: 'roll_no', label: 'Roll No' },
                { key: 'enrolment', label: 'Enrolment' },
                { key: 'course_name', label: 'Course Name' },
                { key: 'programme_code', label: 'Course Code' },
                { key: 'amount', label: 'Amount' },
                { key: 'method', label: 'Method' },
                { key: 'payment_type', label: 'Type' }
              ].map(col => (
                <th key={col.key} onClick={() => handleSort(col.key)} style={{ cursor: 'pointer', position: 'relative', minWidth: colWidths[col.key] || 'auto', width: colWidths[col.key] || 'auto', maxWidth: colWidths[col.key] || 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', paddingRight: '12px' }}>
                    {col.label} <SortIcon column={col.key} />
                  </div>
                  <div
                    onMouseDown={(e) => handleMouseDown(e, col.key)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute', right: 0, top: 0, bottom: 0, width: '8px', cursor: 'col-resize', zIndex: 2,
                      backgroundColor: 'transparent', borderRight: '2px solid rgba(255,255,255,0.05)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Drag to resize"
                  />
                </th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? (
                Array.from({length:10}).map((_,i) => (
                  <tr key={i}><td colSpan={9}><div className="loading-skeleton" style={{height:'20px',borderRadius:'4px'}}></div></td></tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={9} className="table-empty">
                  <div className="table-empty-icon">🔍</div>
                  <div className="table-empty-text">No payments found</div>
                  <div className="table-empty-sub">Try adjusting your search or filters</div>
                </td></tr>
              ) : data.map((p, i) => (
                <React.Fragment key={p.id}>
                  <tr className="clickable" onClick={() => setExpandedRow(expandedRow === i ? null : i)} style={{cursor:'pointer'}}>
                    <td style={{fontSize:'var(--text-xs)',whiteSpace:'nowrap',maxWidth:colWidths['created_at']||'200px',overflow:'hidden',textOverflow:'ellipsis'}}>{formatDate(p.created_at)}</td>
                    <td style={{fontWeight:500,maxWidth:colWidths['student_name']||'200px',overflow:'hidden',textOverflow:'ellipsis'}} title={p.student_name}>{p.student_name || '—'}</td>
                    <td style={{maxWidth:colWidths['roll_no']||'150px'}}><code style={{fontSize:'var(--text-xs)',background:'var(--bg-hover)',padding:'2px 6px',borderRadius:'4px'}}>{p.roll_no || '—'}</code></td>
                    <td style={{maxWidth:colWidths['enrolment']||'150px'}}><code style={{fontSize:'var(--text-xs)',background:'var(--bg-hover)',padding:'2px 6px',borderRadius:'4px'}}>{p.enrolment || '—'}</code></td>
                    <td style={{maxWidth:colWidths['course_name']||'150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize:'var(--text-xs)'}} title={p.course_name}>{p.course_name || '—'}</td>
                    <td style={{maxWidth:colWidths['programme_code']||'150px'}}><span className="badge info">{p.programme_code || '—'}</span></td>
                    <td style={{fontWeight:600,color:'var(--accent-emerald-soft)'}}>{formatCurrency(p.amount)}</td>
                    <td>{getMethodIcon(p.method)} {p.method}</td>
                    <td><span className="badge" style={{background: p.payment_type?.includes('Admission') ? 'var(--accent-blue-dim)' : p.payment_type?.includes('Continuation') ? 'var(--accent-emerald-dim)' : 'var(--accent-amber-dim)', color: p.payment_type?.includes('Admission') ? 'var(--accent-blue-soft)' : p.payment_type?.includes('Continuation') ? 'var(--accent-emerald-soft)' : 'var(--accent-amber-soft)', fontSize:'var(--text-xs)',padding:'2px 8px',borderRadius:'var(--radius-full)'}}>{p.payment_type}</span></td>
                  </tr>
                  {expandedRow === i && (
                    <tr key={`${p.id}-detail`}><td colSpan={9} style={{background:'var(--bg-hover)',padding:'var(--space-4) var(--space-6)'}}>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'var(--space-4)',fontSize:'var(--text-sm)'}}>
                        <div><span style={{color:'var(--text-tertiary)'}}>Payment ID</span><br/><code style={{fontSize:'var(--text-xs)'}}>{p.id}</code></div>
                        <div><span style={{color:'var(--text-tertiary)'}}>Email</span><br/>{p.email || '—'}</div>
                        <div><span style={{color:'var(--text-tertiary)'}}>Phone</span><br/>{p.contact || p.mobile || '—'}</div>
                        <div><span style={{color:'var(--text-tertiary)'}}>Enrolment</span><br/>{p.enrolment || '—'}</div>
                        <div><span style={{color:'var(--text-tertiary)'}}>Hall Code</span><br/>{p.hall_code || '—'}</div>
                        <div><span style={{color:'var(--text-tertiary)'}}>Residential</span><br/>{p.residential_status || '—'}</div>
                        <div><span style={{color:'var(--text-tertiary)'}}>Application No</span><br/>{p.application_no || '—'}</div>
                        <div><span style={{color:'var(--text-tertiary)'}}>Order ID</span><br/><code style={{fontSize:'var(--text-xs)'}}>{p.order_id || '—'}</code></div>
                      </div>
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{display:'flex',justifyContent:'center',gap:'var(--space-2)',marginTop:'var(--space-5)'}}>
          <button className="btn btn-ghost" disabled={pagination.page <= 1} onClick={() => fetchData(pagination.page - 1, search)} style={{padding:'var(--space-2) var(--space-4)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-md)',background:'transparent',color:'var(--text-secondary)',cursor:'pointer'}}>← Prev</button>
          <span style={{padding:'var(--space-2) var(--space-4)',color:'var(--text-secondary)',fontSize:'var(--text-sm)'}}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button className="btn btn-ghost" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchData(pagination.page + 1, search)} style={{padding:'var(--space-2) var(--space-4)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-md)',background:'transparent',color:'var(--text-secondary)',cursor:'pointer'}}>Next →</button>
        </div>
      )}
    </div>
  );
}
