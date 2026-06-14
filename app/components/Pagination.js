'use client';

/**
 * ============================================================================
 * PAGINATION COMPONENT
 * ============================================================================
 *
 * Shows page numbers with prev/next buttons, ellipsis for large page counts,
 * and current-page highlighting.
 *
 * Props:
 *   currentPage  {number}
 *   totalPages   {number}
 *   onPageChange {(page: number) => void}
 *   siblingCount {number} — pages shown around current (default 1)
 * ============================================================================
 */

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  siblingCount = 1,
}) {
  if (totalPages <= 1) return null;

  // ── Build visible page numbers ────────────────────────────────────────
  const pages = buildPageRange(currentPage, totalPages, siblingCount);

  return (
    <div className="pagination">
      {/* Previous */}
      <button
        className="pagination-btn"
        disabled={currentPage <= 1}
        onClick={() => onPageChange?.(currentPage - 1)}
        aria-label="Previous page"
      >
        ‹
      </button>

      {/* Page numbers */}
      {pages.map((page, idx) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
              …
            </span>
          );
        }

        return (
          <button
            key={page}
            className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange?.(page)}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        );
      })}

      {/* Next */}
      <button
        className="pagination-btn"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange?.(currentPage + 1)}
        aria-label="Next page"
      >
        ›
      </button>

      {/* Page info */}
      <span className="pagination-info">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
}

/**
 * Build an array of page numbers (and '...' placeholders) to render.
 *
 * @param {number} current
 * @param {number} total
 * @param {number} siblings
 * @returns {(number|string)[]}
 */
function buildPageRange(current, total, siblings) {
  const totalPageNumbers = siblings * 2 + 5; // siblings + first + last + current + 2 ellipses

  // If total fits without ellipsis, show all pages
  if (total <= totalPageNumbers) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblings, 1);
  const rightSibling = Math.min(current + siblings, total);

  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < total - 1;

  // Case 1: dots only on right
  if (!showLeftDots && showRightDots) {
    const leftRange = Array.from({ length: 3 + 2 * siblings }, (_, i) => i + 1);
    return [...leftRange, '...', total];
  }

  // Case 2: dots only on left
  if (showLeftDots && !showRightDots) {
    const rightRange = Array.from(
      { length: 3 + 2 * siblings },
      (_, i) => total - (3 + 2 * siblings) + i + 1
    );
    return [1, '...', ...rightRange];
  }

  // Case 3: dots on both sides
  const middleRange = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, i) => leftSibling + i
  );
  return [1, '...', ...middleRange, '...', total];
}
