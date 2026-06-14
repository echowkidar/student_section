'use client';

/**
 * ============================================================================
 * CHART.JS WRAPPER — Client Component
 * ============================================================================
 *
 * Registers all required Chart.js components and exports pre-configured
 * chart types with a dark-theme default. This wrapper exists because
 * Chart.js must run on the client side.
 *
 * Exports:
 *   - Bar, Line, Pie, Doughnut — React chart components
 *   - darkThemeDefaults        — Shared dark-mode chart options
 *   - chartColors              — Consistent colour palette for datasets
 * ============================================================================
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

import {
  Bar as BarChart,
  Line as LineChart,
  Pie as PieChart,
  Doughnut as DoughnutChart,
} from 'react-chartjs-2';

// ---------------------------------------------------------------------------
// Register all required Chart.js components
// ---------------------------------------------------------------------------
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ---------------------------------------------------------------------------
// Dark Theme Defaults
// ---------------------------------------------------------------------------
/**
 * Sensible dark-theme defaults that can be spread into any chart's `options`.
 * Override individual keys as needed.
 */
export const darkThemeDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 800,
    easing: 'easeOutQuart',
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        color: '#94a3b8',
        font: {
          family: "'Inter', sans-serif",
          size: 12,
          weight: 500,
        },
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 20,
        boxWidth: 8,
        boxHeight: 8,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(18, 18, 26, 0.95)',
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      cornerRadius: 10,
      padding: 12,
      titleFont: {
        family: "'Inter', sans-serif",
        size: 13,
        weight: 600,
      },
      bodyFont: {
        family: "'Inter', sans-serif",
        size: 12,
      },
      displayColors: true,
      boxWidth: 8,
      boxHeight: 8,
      usePointStyle: true,
    },
    title: {
      display: false,
      color: '#f1f5f9',
      font: {
        family: "'Inter', sans-serif",
        size: 16,
        weight: 700,
      },
      padding: { bottom: 16 },
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.04)',
        drawBorder: false,
      },
      ticks: {
        color: '#64748b',
        font: {
          family: "'Inter', sans-serif",
          size: 11,
        },
        padding: 8,
      },
      border: {
        display: false,
      },
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.04)',
        drawBorder: false,
      },
      ticks: {
        color: '#64748b',
        font: {
          family: "'Inter', sans-serif",
          size: 11,
        },
        padding: 8,
      },
      border: {
        display: false,
      },
    },
  },
};

/** Minimal options for Pie/Doughnut (no axes) */
export const darkThemePieDefaults = {
  ...darkThemeDefaults,
  scales: undefined, // Pie/Doughnut don't use scales
  cutout: undefined,
};

/** Doughnut-specific defaults */
export const darkThemeDoughnutDefaults = {
  ...darkThemePieDefaults,
  cutout: '65%',
};

// ---------------------------------------------------------------------------
// Colour Palette for Datasets
// ---------------------------------------------------------------------------
export const chartColors = {
  blue:    { bg: 'rgba(59, 130, 246, 0.7)',  border: '#3b82f6', bgFaded: 'rgba(59, 130, 246, 0.15)' },
  emerald: { bg: 'rgba(16, 185, 129, 0.7)',  border: '#10b981', bgFaded: 'rgba(16, 185, 129, 0.15)' },
  amber:   { bg: 'rgba(245, 158, 11, 0.7)',  border: '#f59e0b', bgFaded: 'rgba(245, 158, 11, 0.15)' },
  rose:    { bg: 'rgba(244, 63, 94, 0.7)',   border: '#f43f5e', bgFaded: 'rgba(244, 63, 94, 0.15)' },
  purple:  { bg: 'rgba(168, 85, 247, 0.7)',  border: '#a855f7', bgFaded: 'rgba(168, 85, 247, 0.15)' },
  cyan:    { bg: 'rgba(6, 182, 212, 0.7)',   border: '#06b6d4', bgFaded: 'rgba(6, 182, 212, 0.15)' },
  pink:    { bg: 'rgba(236, 72, 153, 0.7)',  border: '#ec4899', bgFaded: 'rgba(236, 72, 153, 0.15)' },
  indigo:  { bg: 'rgba(99, 102, 241, 0.7)',  border: '#6366f1', bgFaded: 'rgba(99, 102, 241, 0.15)' },
  teal:    { bg: 'rgba(20, 184, 166, 0.7)',  border: '#14b8a6', bgFaded: 'rgba(20, 184, 166, 0.15)' },
  orange:  { bg: 'rgba(249, 115, 22, 0.7)',  border: '#f97316', bgFaded: 'rgba(249, 115, 22, 0.15)' },
};

/**
 * Get an array of background colours from the palette (for pie/doughnut).
 *
 * @param {number} count — Number of colours needed
 * @returns {{ backgrounds: string[], borders: string[] }}
 */
export function getChartColorArray(count) {
  const keys = Object.keys(chartColors);
  const backgrounds = [];
  const borders = [];

  for (let i = 0; i < count; i++) {
    const color = chartColors[keys[i % keys.length]];
    backgrounds.push(color.bg);
    borders.push(color.border);
  }

  return { backgrounds, borders };
}

// ---------------------------------------------------------------------------
// Exports — Named chart components
// ---------------------------------------------------------------------------
export const Bar = BarChart;
export const Line = LineChart;
export const Pie = PieChart;
export const Doughnut = DoughnutChart;

export default {
  Bar: BarChart,
  Line: LineChart,
  Pie: PieChart,
  Doughnut: DoughnutChart,
};
