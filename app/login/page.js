'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid email or password');
        setLoading(false);
        return;
      }

      router.push('/');
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '440px' }}>
      {/* Logo & Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <div style={{
          width: '72px',
          height: '72px',
          margin: '0 auto var(--space-5)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.3)',
        }}>
          <img src="/android-chrome-192x192.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <h1 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: '800',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-2)',
          letterSpacing: '-0.02em',
        }}>
          Student Fee Management
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
          Sign in to your account to continue
        </p>
      </div>

      {/* Login Card */}
      <div className="glass-card" style={{
        padding: 'var(--space-8)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Error Alert */}
          {error && (
            <div style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--accent-rose-dim)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-rose-soft)',
              fontSize: 'var(--text-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Email Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: 'var(--text-md)', pointerEvents: 'none',
              }}>📧</span>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{ paddingLeft: 'var(--space-10)' }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: 'var(--text-md)', pointerEvents: 'none',
              }}>🔒</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingLeft: 'var(--space-10)', paddingRight: 'var(--space-10)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 'var(--text-md)',
                  padding: '2px', display: 'flex', alignItems: 'center',
                }}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div style={{ textAlign: 'right', marginTop: '-var(--space-2)' }}>
            <Link href="/forgot-password" style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--accent-blue-soft)',
              transition: 'color 150ms',
            }}>
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-5)',
              background: loading
                ? 'var(--bg-elevated)'
                : 'linear-gradient(135deg, var(--accent-blue), #2563eb)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-md)',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: loading ? 'none' : '0 4px 15px rgba(59, 130, 246, 0.35)',
              opacity: loading ? 0.6 : 1,
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.01em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.boxShadow = '0 6px 25px rgba(59, 130, 246, 0.45)';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = loading ? 'none' : '0 4px 15px rgba(59, 130, 246, 0.35)';
              e.target.style.transform = 'none';
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white', borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite', display: 'inline-block',
                }} />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>

      {/* Register Link */}
      <p style={{
        textAlign: 'center',
        marginTop: 'var(--space-6)',
        color: 'var(--text-tertiary)',
        fontSize: 'var(--text-sm)',
      }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{
          color: 'var(--accent-blue-soft)',
          fontWeight: '600',
          transition: 'color 150ms',
        }}>
          Register
        </Link>
      </p>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
