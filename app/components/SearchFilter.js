'use client';

/**
 * ============================================================================
 * SEARCH & FILTER BAR COMPONENT
 * ============================================================================
 *
 * A responsive bar with a search input and dropdown filters.
 * Search is debounced to avoid excessive re-renders.
 *
 * Props:
 *   searchPlaceholder {string}
 *   searchValue       {string}        — Controlled search value
 *   filters           {Array<{ name, label, options: Array<{value, label}> }>}
 *   filterValues      {object}        — { [filterName]: selectedValue }
 *   onSearch          {(value: string) => void}
 *   onFilterChange    {(name: string, value: string) => void}
 *   debounceMs        {number}        — Debounce delay (default: 300)
 * ============================================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export default function SearchFilter({
  searchPlaceholder = 'Search…',
  searchValue: controlledSearch = '',
  filters = [],
  filterValues = {},
  onSearch,
  onFilterChange,
  debounceMs = 300,
}) {
  const [localSearch, setLocalSearch] = useState(controlledSearch);
  const debounceTimer = useRef(null);

  // Sync controlled value → local state
  useEffect(() => {
    setLocalSearch(controlledSearch);
  }, [controlledSearch]);

  // Debounced search callback
  const handleSearchInput = useCallback(
    (e) => {
      const val = e.target.value;
      setLocalSearch(val);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(() => {
        onSearch?.(val);
      }, debounceMs);
    },
    [onSearch, debounceMs]
  );

  // Clear on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Handle instant search on Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      onSearch?.(localSearch);
    }
  };

  // Clear search
  const handleClear = () => {
    setLocalSearch('');
    onSearch?.('');
  };

  return (
    <div className="filter-bar">
      {/* ── Search Input ──────────────────────────────────────────── */}
      <div className="search-container">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder={searchPlaceholder}
          value={localSearch}
          onChange={handleSearchInput}
          onKeyDown={handleKeyDown}
          aria-label="Search"
        />
        {localSearch && (
          <button
            onClick={handleClear}
            className="search-clear"
            aria-label="Clear search"
            style={{
              position: 'absolute',
              right: 'var(--space-3)',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 'var(--text-md)',
              padding: '2px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Filter Dropdowns ──────────────────────────────────────── */}
      {filters.map((filter) => (
        <select
          key={filter.name}
          className="filter-select"
          value={filterValues[filter.name] || ''}
          onChange={(e) => onFilterChange?.(filter.name, e.target.value)}
          aria-label={filter.label}
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
