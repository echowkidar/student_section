'use client';

/**
 * ============================================================================
 * STATS CARD COMPONENT
 * ============================================================================
 *
 * A reusable stats card with count-up animation, glassmorphism styling,
 * and optional trend indicator.
 *
 * Props:
 *   title    {string}  — Label shown below the value
 *   value    {string}  — The display value (e.g. "₹12,34,567")
 *   subtitle {string}  — Optional secondary text
 *   icon     {string}  — Emoji or icon string
 *   trend    {'up'|'down'|'neutral'} — Trend direction
 *   trendValue {string} — e.g. "+12.5%"
 *   color    {'blue'|'emerald'|'amber'|'rose'|'purple'|'cyan'}
 * ============================================================================
 */

import { useEffect, useRef, useState } from 'react';

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend = 'neutral',
  trendValue,
  color = 'blue',
}) {
  const [displayValue, setDisplayValue] = useState('');
  const [hasAnimated, setHasAnimated] = useState(false);
  const cardRef = useRef(null);

  // ── Count-up animation using IntersectionObserver ─────────────────────
  useEffect(() => {
    if (hasAnimated || !value) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animateValue(value);
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  /**
   * Animate a value from 0 → target.
   * Works with numbers (with optional prefix/suffix) and plain strings.
   */
  function animateValue(targetStr) {
    const str = String(targetStr);

    // Extract numeric portion
    const numericMatch = str.match(/([\d,]+\.?\d*)/);
    if (!numericMatch) {
      setDisplayValue(str);
      return;
    }

    const prefix = str.slice(0, numericMatch.index);
    const suffix = str.slice(numericMatch.index + numericMatch[0].length);
    const target = parseFloat(numericMatch[0].replace(/,/g, ''));

    if (isNaN(target)) {
      setDisplayValue(str);
      return;
    }

    const duration = 1200; // ms
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      // Ease-out curve: decelerate towards the end
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      current = target * eased;

      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(str); // Exact final value
        return;
      }

      // Format with commas (Indian system)
      const formatted = formatNumberIndian(Math.round(current));
      setDisplayValue(`${prefix}${formatted}${suffix}`);
    }, duration / steps);
  }

  function formatNumberIndian(num) {
    const str = String(num);
    if (str.length <= 3) return str;

    // Indian grouping: last 3 digits, then groups of 2
    const last3 = str.slice(-3);
    const rest = str.slice(0, -3);
    const groups = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return `${groups},${last3}`;
  }

  // ── Trend arrow & label ───────────────────────────────────────────────
  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <div ref={cardRef} className={`glass-card stat-card ${color}`}>
      <div className="stat-card-header">
        <div className={`stat-card-icon ${color}`}>
          {icon || '📊'}
        </div>
        {trendValue && (
          <span className={`stat-card-trend ${trend}`}>
            {trendArrow} {trendValue}
          </span>
        )}
      </div>

      <div className="stat-card-value" style={{ animation: hasAnimated ? 'countUp 400ms ease-out' : 'none' }}>
        {displayValue || value || '—'}
      </div>

      <div className="stat-card-title">{title}</div>

      {subtitle && (
        <div className="stat-card-subtitle">{subtitle}</div>
      )}
    </div>
  );
}
