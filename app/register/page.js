'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  
  // Step 1 state
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Step 2 state
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

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
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send OTP. Please try again.');
        setLoading(false);
        return;
      }

      if (data.bypassed) {
        // SMTP is disabled, user is registered directly
        router.push('/login?registered=true');
      } else {
        // Show OTP step
        setStep(2);
        setLoading(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid OTP. Please try again.');
        setLoading(false);
        return;
      }

      router.push('/login?registered=true');
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
          Create Account
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
          {step === 1 ? 'Join the Student Fee Management System' : 'Check your email for the OTP'}
        </p>
      </div>

      {/* Register Card */}
      <div className="glass-card" style={{
        padding: 'var(--space-8)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      }}>
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
            marginBottom: 'var(--space-5)',
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            
            {/* Name Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: 'var(--text-md)', pointerEvents: 'none',
                }}>👤</span>
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  style={{ paddingLeft: 'var(--space-10)' }}
                />
              </div>
            </div>

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

            {/* Confirm Password Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: 'var(--text-md)', pointerEvents: 'none',
                }}>🔐</span>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Re-enter your password"
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: 'var(--space-3) var(--space-5)',
                background: loading
                  ? 'var(--bg-elevated)'
                  : 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-md)',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
              }}
            >
              {loading ? 'Sending OTP...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                We've sent a 6-digit OTP to <strong>{email}</strong>
              </p>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="otp">Enter OTP</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: 'var(--text-md)', pointerEvents: 'none',
                }}>🔑</span>
                <input
                  id="otp"
                  type="text"
                  className="form-input"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  style={{ paddingLeft: 'var(--space-10)', fontSize: '18px', letterSpacing: '4px', textAlign: 'center' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-md)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '10px',
                  background: loading ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 15px rgba(16, 185, 129, 0.35)',
                }}
              >
                {loading ? 'Verifying...' : 'Verify & Register'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Login Link */}
      <p style={{
        textAlign: 'center',
        marginTop: 'var(--space-6)',
        color: 'var(--text-tertiary)',
        fontSize: 'var(--text-sm)',
      }}>
        Already have an account?{' '}
        <Link href="/login" style={{
          color: 'var(--accent-blue-soft)',
          fontWeight: '600',
          transition: 'color 150ms',
        }}>
          Login
        </Link>
      </p>
    </div>
  );
}
