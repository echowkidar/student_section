'use client';

/**
 * ============================================================================
 * ROOT LAYOUT — Student Fee Management System
 * ============================================================================
 *
 * App-shell layout with a collapsible sidebar and main content area.
 * Uses Next.js App Router with client-side state for sidebar toggle.
 * ============================================================================
 */

import './globals.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

/* ---------------------------------------------------------------------------
 * Navigation configuration
 * ------------------------------------------------------------------------- */
const NAV_SECTIONS = [
  {
    label: 'Overview',
    links: [
      { href: '/',          icon: '📊', label: 'Dashboard' },
      { href: '/analytics',    icon: '📈', label: 'Analytics' },
      { href: '/payments',  icon: '💳', label: 'Payments' },
    ],
  },
  {
    label: 'Reports',
    links: [
      { href: '/reports/head-wise',   icon: '📑', label: 'Head-wise Reports' },
      { href: '/reports/hall-wise',   icon: '🏫', label: 'Hall Reports' },
      { href: '/reports/course-wise', icon: '🎓', label: 'Course Reports' },
    ],
  },
  {
    label: 'Management',
    links: [
      { href: '/import',       icon: '📥', label: 'Import Data' },
      { href: '/fee-structure', icon: '💰', label: 'Fee Structure' },
      { href: '/master-data',  icon: '🔧', label: 'Master Data' },
    ],
  },
  {
    label: 'Utilities',
    links: [
      { href: '/print-reports', icon: '📄', label: 'Print Reports' },
      { href: '/settings',      icon: '⚙️', label: 'Settings' },
    ],
  },
];

// Auth paths that don't require login
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

/* ---------------------------------------------------------------------------
 * Root Layout Component
 * ------------------------------------------------------------------------- */
export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
          if (!AUTH_PATHS.includes(pathname) && !pathname.startsWith('/reset-password')) {
            router.push('/login');
          }
        }
      } catch (e) {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [pathname, router]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile sidebar on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  /**
   * Determine if a nav link matches the current pathname.
   * Dashboard (/) matches only exactly; other routes match if pathname starts with href.
   */
  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  // If on auth path, don't show app shell
  const isAuthPath = AUTH_PATHS.includes(pathname) || pathname.startsWith('/reset-password');

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Student Fee Management System — Track, analyse, and manage student fee payments" />
        <title>Student Fee Management</title>
      </head>

      <body suppressHydrationWarning>
        {authLoading ? (
          <div style={{ background: 'var(--bg-base)', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
            Loading...
          </div>
        ) : isAuthPath ? (
          <>{children}</>
        ) : (
          <div className="app-shell">
            {/* ── Mobile Backdrop ──────────────────────────────────────── */}
            {mobileOpen && (
            <div
              className="sidebar-backdrop"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* ── Sidebar ─────────────────────────────────────────────── */}
          <aside
            className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}
            role="navigation"
            aria-label="Main navigation"
          >
            {/* Branding */}
            <div className="sidebar-header">
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}>
                <img src="/android-chrome-192x192.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div className="sidebar-title">
                Student Fee<br />Management
              </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
              {NAV_SECTIONS.map((section) => (
                <div key={section.label}>
                  <div className="sidebar-section">{section.label}</div>
                  {section.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`sidebar-link ${isActive(link.href) ? 'active' : ''}`}
                      title={link.label}
                    >
                      <span className="sidebar-link-icon">{link.icon}</span>
                      <span className="sidebar-link-label">{link.label}</span>
                    </Link>
                  ))}
                </div>
              ))}
              
              {user?.role === 'admin' && (
                <div>
                  <div className="sidebar-section">Admin</div>
                  <Link href="/user-management" className={`sidebar-link ${isActive('/user-management') ? 'active' : ''}`} title="User Management">
                    <span className="sidebar-link-icon">👥</span>
                    <span className="sidebar-link-label">User Management</span>
                  </Link>
                </div>
              )}
            </nav>

            <div style={{ marginTop: 'auto', padding: '15px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {!collapsed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                    👤
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {user?.role === 'admin' ? 'Administrator' : user?.role === 'sub admin' ? 'Sub Administrator' : 'User'}
                    </span>
                  </div>
                </div>
              )}
              <button 
                onClick={handleLogout} 
                style={{ background: 'var(--bg-hover)', border: 'none', padding: '8px', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: collapsed ? 'center' : 'flex-start' }}
                title="Logout"
              >
                <span>🚪</span>
                {!collapsed && <span>Logout</span>}
              </button>
            </div>

            {/* Collapse toggle */}
            <div className="sidebar-toggle" style={{ paddingBottom: '60px' }}>
              <button
                className="sidebar-toggle-btn"
                onClick={() => setCollapsed((c) => !c)}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <span style={{ transition: 'transform 250ms', transform: collapsed ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>
                  ◀
                </span>
                {!collapsed && <span>Collapse</span>}
              </button>
            </div>
          </aside>

          {/* ── Main Content ────────────────────────────────────────── */}
          <main className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Mobile menu button (visible only on small screens) */}
            <button
              className="btn btn-ghost btn-icon mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              style={{
                display: 'none',
                marginBottom: 'var(--space-4)',
              }}
            >
              ☰
            </button>

            {children}
          </main>
        </div>
        )}

        {/* Inline style for mobile menu button visibility */}
        <style>{`
          @media (max-width: 1024px) {
            .mobile-menu-btn {
              display: flex !important;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
