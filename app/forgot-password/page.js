'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetInfo, setResetInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetInfo(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to process request');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // If SMTP is disabled, server returns the token/link directly
      if (data.resetToken || data.resetLink) {
        setResetInfo(data);
      }
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
          Forgot Password
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {/* Card */}
      <div className="glass-card" style={{
        padding: 'var(--space-8)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      }}>
        {!success ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
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
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={{ paddingLeft: 'var(--space-10)' }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: 'var(--space-3) var(--space-5)',
                background: loading
                  ? 'var(--bg-elevated)'
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-md)',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(245, 158, 11, 0.35)',
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
                  e.target.style.boxShadow = '0 6px 25px rgba(245, 158, 11, 0.45)';
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = loading ? 'none' : '0 4px 15px rgba(245, 158, 11, 0.35)';
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
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            {/* Success Message */}
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
              Check Your Email
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-5)',
              lineHeight: '1.6',
            }}>
              If an account exists with <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>,
              you will receive a password reset link.
            </p>

            {/* Show reset info when SMTP is disabled */}
            {resetInfo && (
              <div style={{
                padding: 'var(--space-4)',
                background: 'var(--accent-amber-dim)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-4)',
                textAlign: 'left',
              }}>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: '600',
                  color: 'var(--accent-amber-soft)',
                  marginBottom: 'var(--space-3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}>
                  ⚠️ SMTP is disabled — Reset link shown here:
                </div>
                {resetInfo.resetLink && (
                  <div style={{
                    padding: 'var(--space-3)',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-blue-soft)',
                    wordBreak: 'break-all',
                    marginBottom: 'var(--space-2)',
                  }}>
                    {resetInfo.resetLink}
                  </div>
                )}
                {resetInfo.resetToken && !resetInfo.resetLink && (
                  <div style={{
                    padding: 'var(--space-3)',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-blue-soft)',
                    wordBreak: 'break-all',
                  }}>
                    Token: {resetInfo.resetToken}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => { setSuccess(false); setEmail(''); setResetInfo(null); }}
              style={{
                padding: 'var(--space-2) var(--space-5)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: '600',
                fontFamily: 'var(--font-sans)',
                transition: 'all 150ms',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--bg-hover)';
                e.target.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'var(--bg-elevated)';
                e.target.style.color = 'var(--text-secondary)';
              }}
            >
              Try Another Email
            </button>
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
      `}</style>
    </div>
  );
}
