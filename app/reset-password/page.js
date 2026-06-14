'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing reset token. Please request a new reset link.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
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
          Reset Password
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
          Enter your new password below
        </p>
      </div>

      {/* Card */}
      <div className="glass-card" style={{
        padding: 'var(--space-8)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      }}>
        {!success ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* Token Warning */}
            {!token && (
              <div style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--accent-amber-dim)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--accent-amber-soft)',
                fontSize: 'var(--text-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}>
                <span>⚠️</span> No reset token found. Please use the link from your email.
              </div>
            )}

            {/* Error */}
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

            {/* New Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">New Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: 'var(--text-md)', pointerEvents: 'none',
                }}>🔒</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: 'var(--text-md)', pointerEvents: 'none',
                }}>🔐</span>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={{
                    paddingLeft: 'var(--space-10)',
                    borderColor: confirmPassword && password !== confirmPassword
                      ? 'var(--accent-rose)'
                      : confirmPassword && password === confirmPassword
                        ? 'var(--accent-emerald)'
                        : undefined,
                  }}
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <span className="form-error">Passwords do not match</span>
              )}
              {confirmPassword && password === confirmPassword && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-emerald-soft)' }}>
                  ✓ Passwords match
                </span>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !token}
              style={{
                width: '100%',
                padding: 'var(--space-3) var(--space-5)',
                background: loading || !token
                  ? 'var(--bg-elevated)'
                  : 'linear-gradient(135deg, #a855f7, #7c3aed)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-md)',
                fontWeight: '700',
                cursor: loading || !token ? 'not-allowed' : 'pointer',
                transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: loading || !token ? 'none' : '0 4px 15px rgba(168, 85, 247, 0.35)',
                opacity: loading || !token ? 0.6 : 1,
                fontFamily: 'var(--font-sans)',
                letterSpacing: '0.01em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
              }}
              onMouseEnter={(e) => {
                if (!loading && token) {
                  e.target.style.boxShadow = '0 6px 25px rgba(168, 85, 247, 0.45)';
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = (loading || !token) ? 'none' : '0 4px 15px rgba(168, 85, 247, 0.35)';
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
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'var(--accent-emerald-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto var(--space-4)',
              fontSize: '1.5rem',
            }}>
              ✅
            </div>
            <h3 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-lg)' }}>
              Password Reset Successful!
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-4)',
              lineHeight: '1.6',
            }}>
              Your password has been updated successfully.
              <br />Redirecting to login page...
            </p>
            <div style={{
              width: '40px', height: '4px', background: 'var(--accent-emerald)',
              borderRadius: 'var(--radius-full)', margin: '0 auto',
              animation: 'shrink 3s linear forwards',
            }} />
          </div>
        )}
      </div>

      {/* Back to Login */}
      <p style={{
        textAlign: 'center',
        marginTop: 'var(--space-6)',
        color: 'var(--text-tertiary)',
        fontSize: 'var(--text-sm)',
      }}>
        <Link href="/login" style={{
          color: 'var(--accent-blue-soft)',
          fontWeight: '600',
          transition: 'color 150ms',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}>
          ← Back to Login
        </Link>
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shrink {
          from { width: 200px; }
          to { width: 0; }
        }
      `}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{
        width: '100%', maxWidth: '440px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '300px', color: 'var(--text-secondary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{
            width: '24px', height: '24px', border: '2px solid var(--border-default)',
            borderTopColor: 'var(--accent-blue)', borderRadius: '50%',
            animation: 'spin 0.6s linear infinite', display: 'inline-block',
            marginBottom: 'var(--space-3)',
          }} />
          <p style={{ fontSize: 'var(--text-sm)' }}>Loading...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
