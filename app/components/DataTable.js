'use client';

/**
 * ============================================================================
 * DATA TABLE COMPONENT
 * ============================================================================
 *
 * A full-featured, dark-themed data table with:
 *  - Column-based sorting (clickable headers)
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
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width }}>
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
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width }}>
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
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={sortBy === col.key ? 'sorted' : ''}
                style={{
                  width: col.width,
                  textAlign: col.align || 'left',
                  cursor: col.sortable ? 'pointer' : 'default',
                }}
                onClick={() => handleSort(col)}
              >
                {col.label}
                {col.sortable && (
                  <span className="sort-arrow">{getSortArrow(col.key)}</span>
                )}
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
                  style={{ textAlign: col.align || 'left' }}
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
