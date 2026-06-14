'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * ============================================================================
 * DATA TABLE COMPONENT
 * ============================================================================
 *
 * A full-featured, dark-themed data table with:
 *  - Column-based sorting (clickable headers)
 *  - Column resizing
 *  - Loading skeleton state
 *  - Empty state with illustration
 *  - Zebra-striped rows with hover effects
 *  - Optional row click handler
 *
 * Props:
 *   columns     {Array<{ key, label, sortable?, render?, align?, width? }>}
 *   data        {Array<object>}
 *   loading     {boolean}
 *   onSort      {(key: string) => void}
 *   sortBy      {string}
 *   sortOrder   {'asc'|'desc'}
 *   onRowClick  {(row: object) => void}
 *   emptyIcon   {string}  — Emoji for empty state
 *   emptyTitle  {string}
 *   emptySub    {string}
 * ============================================================================
 */

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  onSort,
  sortBy,
  sortOrder = 'asc',
  onRowClick,
  emptyIcon = '📋',
  emptyTitle = 'No data found',
  emptySub = 'Try adjusting your filters or search query.',
}) {
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
    const newWidth = Math.max(50, startWidth.current + diff); // min width 50px
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

  // ── Sort handler ──────────────────────────────────────────────────────
  const handleSort = (col) => {
    if (!col.sortable || !onSort) return;
    onSort(col.key);
  };

  // ── Sort arrow helper ─────────────────────────────────────────────────
  const getSortArrow = (key) => {
    if (sortBy !== key) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // ── Loading skeleton ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="table-container">
        <table className="data-table" style={{ tableLayout: 'fixed', width: '100%' }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ width: colWidths[col.key] || col.width }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col, j) => (
                  <td key={j}>
                    <div
                      className="skeleton skeleton-text"
                      style={{
                        width: `${55 + Math.random() * 35}%`,
                        animationDelay: `${i * 50 + j * 30}ms`,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────
  if (!data || data.length === 0) {
    return (
      <div className="table-container">
        <table className="data-table" style={{ tableLayout: 'fixed', width: '100%' }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ width: colWidths[col.key] || col.width }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="table-empty">
          <div className="table-empty-icon">{emptyIcon}</div>
          <div className="table-empty-text">{emptyTitle}</div>
          <div className="table-empty-sub">{emptySub}</div>
        </div>
      </div>
    );
  }

  // ── Populated table ───────────────────────────────────────────────────
  return (
    <div className="table-container">
      <table className="data-table" style={{ tableLayout: 'fixed', width: '100%' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={sortBy === col.key ? 'sorted' : ''}
                style={{
                  width: colWidths[col.key] || col.width,
                  textAlign: col.align || 'left',
                  cursor: col.sortable ? 'pointer' : 'default',
                  position: 'relative',
                }}
                onClick={() => handleSort(col)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '10px' }}>
                  <span>{col.label}</span>
                  {col.sortable && (
                    <span className="sort-arrow" style={{ marginLeft: '4px' }}>{getSortArrow(col.key)}</span>
                  )}
                </div>
                {/* Resizer Handle */}
                <div
                  onMouseDown={(e) => handleMouseDown(e, col.key)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '6px',
                    cursor: 'col-resize',
                    zIndex: 1,
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--border-subtle)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx}
              className={onRowClick ? 'clickable' : ''}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{ 
                    textAlign: col.align || 'left',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={String(row[col.key] || '')}
                >
                  {col.render
                    ? col.render(row[col.key], row, rowIdx)
                    : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
