/**
 * ============================================================================
 * UTILITY FUNCTIONS
 * ============================================================================
 *
 * Shared helpers for formatting, parsing, and normalising data throughout the
 * Student Fee Management System.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// Currency Formatting (Indian Number System)
// ---------------------------------------------------------------------------
/**
 * Format a numeric amount as Indian Rupees (₹).
 * Uses the Indian lakh/crore grouping convention.
 *
 * @param {number|string} amount - The amount to format
 * @param {boolean}       [compact=false] - If true, show "₹12.5L" / "₹1.2Cr" style
 * @returns {string}
 *
 * @example
 *   formatCurrency(1234567)       // "₹12,34,567.00"
 *   formatCurrency(1234567, true) // "₹12.35L"
 */
export function formatCurrency(amount, compact = false) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (num == null || isNaN(num)) return '₹0.00';

  if (compact) {
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (abs >= 1_00_00_000) {
      return `${sign}₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
    }
    if (abs >= 1_00_000) {
      return `${sign}₹${(abs / 1_00_000).toFixed(2)}L`;
    }
    if (abs >= 1_000) {
      return `${sign}₹${(abs / 1_000).toFixed(1)}K`;
    }
  }

  // Full Indian-locale formatting
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// ---------------------------------------------------------------------------
// Date Formatting
// ---------------------------------------------------------------------------
/**
 * Parse a date string in DD/MM/YYYY HH:MM:SS (or similar) format and return
 * a human-friendly formatted date.
 *
 * @param {string} dateStr   - Raw date string
 * @param {object} [opts]
 * @param {boolean} [opts.includeTime=false] - Whether to include time portion
 * @returns {string}
 *
 * @example
 *   formatDate('15/03/2025 14:30:00')            // "15 Mar 2025"
 *   formatDate('15/03/2025 14:30:00', {includeTime: true}) // "15 Mar 2025, 2:30 PM"
 */
export function formatDate(dateStr, { includeTime = false } = {}) {
  if (!dateStr) return '—';

  try {
    let date;

    // Try DD/MM/YYYY pattern first
    const ddmmyyyy = dateStr.match(
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );

    if (ddmmyyyy) {
      const [, day, month, year, hours, minutes] = ddmmyyyy;
      date = new Date(year, month - 1, day, hours || 0, minutes || 0);
    } else {
      // Fallback to native parsing
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) return dateStr; // Return as-is if unparseable

    const options = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };

    if (includeTime) {
      options.hour = 'numeric';
      options.minute = '2-digit';
      options.hour12 = true;
    }

    return date.toLocaleDateString('en-IN', options);
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Payment Data Parsers
// ---------------------------------------------------------------------------
/**
 * Parse the JSON `notes` column from the payment table.
 *
 * @param {string|object} notesStr - JSON string or already-parsed object
 * @returns {object} Parsed notes or empty object
 */
export function parsePaymentNotes(notesStr) {
  if (!notesStr) return {};
  if (typeof notesStr === 'object') return notesStr;

  try {
    return JSON.parse(notesStr);
  } catch {
    return { raw: notesStr };
  }
}

/**
 * Parse a pipe-delimited payment description string.
 * Format: "FIELD1|FIELD2|FIELD3|…"
 *
 * @param {string} descStr - Pipe-delimited description
 * @returns {string[]} Array of fields
 */
export function parsePaymentDescription(descStr) {
  if (!descStr) return [];
  return descStr
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Normalisation Helpers
// ---------------------------------------------------------------------------

/** Map of residential status aliases → canonical values */
const RESIDENTIAL_MAP = {
  yes: 'R',
  y: 'R',
  r: 'R',
  resident: 'R',
  residential: 'R',
  hostel: 'R',
  no: 'NR',
  n: 'NR',
  nr: 'NR',
  'non-resident': 'NR',
  'non resident': 'NR',
  nonresident: 'NR',
  'non-residential': 'NR',
  'day scholar': 'NR',
  dayscholar: 'NR',
};

/**
 * Normalise a residential-status value to "R" or "NR".
 *
 * @param {string} status
 * @returns {string} "R" | "NR" | "Unknown"
 */
export function normalizeResidentialStatus(status) {
  if (!status) return 'Unknown';
  const key = String(status).trim().toLowerCase();
  return RESIDENTIAL_MAP[key] || 'Unknown';
}

/** Map of hall-code aliases → canonical hall codes */
const HALL_ALIAS_MAP = {
  // Lala Lajpat Rai Hall
  llr: 'LLR',
  'l.l.r': 'LLR',
  lalalhall: 'LLR',
  // Rajendra Prasad Hall
  rp: 'RP',
  'r.p': 'RP',
  rphal: 'RP',
  // Patel Hall
  patel: 'PATEL',
  pt: 'PATEL',
  // Nehru Hall
  nehru: 'NEHRU',
  nh: 'NEHRU',
  // Azad Hall
  azad: 'AZAD',
  az: 'AZAD',
  // MS Hall
  ms: 'MS',
  mshall: 'MS',
  // RLB Hall
  rlb: 'RLB',
  'r.l.b': 'RLB',
  // HJB Hall
  hjb: 'HJB',
  'h.j.b': 'HJB',
  // MMM Hall
  mmm: 'MMM',
  'm.m.m': 'MMM',
  // VSH Hall
  vsh: 'VSH',
  // Nivedita Hall
  nivedita: 'NIVEDITA',
  niv: 'NIVEDITA',
  // MT Hall
  mt: 'MT',
  mthall: 'MT',
  // SN/SN Bose Hall
  snb: 'SNB',
  'sn bose': 'SNB',
  // BR Ambedkar Hall
  bra: 'BRA',
  ambedkar: 'BRA',
  // Gokhale Hall
  gokhale: 'GOKHALE',
  gkh: 'GOKHALE',
  // Attached (non-residential)
  attached: 'ATTACHED',
  att: 'ATTACHED',
  nonres: 'ATTACHED',
};

/**
 * Normalise a hall code to its canonical form.
 *
 * @param {string} code
 * @returns {string}
 */
export function normalizeHallCode(code) {
  if (!code) return '';
  const cleaned = String(code).trim();
  const key = cleaned.toLowerCase().replace(/[\s.-]+/g, '');
  return HALL_ALIAS_MAP[key] || cleaned.toUpperCase();
}

/** Map of faculty-name variants → canonical faculty names */
const FACULTY_ALIAS_MAP = {
  // Short forms → full names
  agri: 'Agriculture',
  agriculture: 'Agriculture',
  'agri engg': 'Agricultural Engineering',
  arts: 'Arts',
  commerce: 'Commerce',
  education: 'Education',
  engg: 'Engineering',
  engineering: 'Engineering',
  'fine arts': 'Fine Arts',
  law: 'Law',
  'law faculty': 'Law',
  management: 'Management Studies',
  'management studies': 'Management Studies',
  medicine: 'Medicine',
  'medical sciences': 'Medicine',
  performing: 'Performing Arts',
  'performing arts': 'Performing Arts',
  science: 'Science',
  'social science': 'Social Sciences',
  'social sciences': 'Social Sciences',
  veterinary: 'Veterinary Science',
  'vet science': 'Veterinary Science',
  'veterinary science': 'Veterinary Science',
};

/**
 * Normalise a faculty name to its canonical form.
 *
 * @param {string} name
 * @returns {string}
 */
export function normalizeFacultyName(name) {
  if (!name) return '';
  const key = String(name).trim().toLowerCase();
  return FACULTY_ALIAS_MAP[key] || name.trim();
}

// ---------------------------------------------------------------------------
// UI Helpers
// ---------------------------------------------------------------------------

/** Colour map for payment types (CSS variable-friendly) */
const PAYMENT_TYPE_COLORS = {
  admission: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: '#3b82f6' },
  continuation: { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: '#10b981' },
  examination: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: '#f59e0b' },
  hostel: { bg: 'rgba(168,85,247,0.15)', text: '#c084fc', border: '#a855f7' },
  mess: { bg: 'rgba(236,72,153,0.15)', text: '#f472b6', border: '#ec4899' },
  library: { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf', border: '#14b8a6' },
  registration: { bg: 'rgba(99,102,241,0.15)', text: '#818cf8', border: '#6366f1' },
  other: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', border: '#64748b' },
};

/**
 * Get the colour scheme for a payment type.
 *
 * @param {string} type
 * @returns {{ bg: string, text: string, border: string }}
 */
export function getPaymentTypeColor(type) {
  if (!type) return PAYMENT_TYPE_COLORS.other;
  const key = String(type).trim().toLowerCase();
  return PAYMENT_TYPE_COLORS[key] || PAYMENT_TYPE_COLORS.other;
}

/** Icon map for payment methods */
const METHOD_ICONS = {
  upi: '📱',
  'net banking': '🏦',
  netbanking: '🏦',
  neft: '🏦',
  rtgs: '🏦',
  imps: '🏦',
  card: '💳',
  'debit card': '💳',
  'credit card': '💳',
  cash: '💵',
  cheque: '📝',
  dd: '📋',
  'demand draft': '📋',
  wallet: '👛',
  online: '🌐',
};

/**
 * Get an emoji icon for a payment method.
 *
 * @param {string} method
 * @returns {string}
 */
export function getMethodIcon(method) {
  if (!method) return '💰';
  const key = String(method).trim().toLowerCase();
  return METHOD_ICONS[key] || '💰';
}

/**
 * Truncate text with an ellipsis.
 *
 * @param {string} text
 * @param {number} [maxLen=50]
 * @returns {string}
 */
export function truncateText(text, maxLen = 50) {
  if (!text) return '';
  const str = String(text);
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

/**
 * Generate initials from a name.
 *
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name) {
  if (!name) return '??';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/**
 * Clamp a number between min and max.
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Create a debounced version of a function.
 *
 * @param {Function} fn
 * @param {number}   delay - Milliseconds
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Build URL query string from an object (skips null/undefined/empty values).
 *
 * @param {object} params
 * @returns {string}
 */
export function buildQueryString(params) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}
