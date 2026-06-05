import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { authApi } from '../../shared/api/authApi';
import AuthBrandPanel, { AUTH_PRIMARY as PRIMARY } from './AuthBrandPanel';

const OTP_LENGTH = 6;
const SUPPORT_EMAIL = 'support@iyte.edu.tr';

type Stage = 'email' | 'code';

function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<{ error?: { message?: string } }>;
  if (axiosError.code === 'ECONNABORTED') {
    return 'Server is taking too long to respond. Please try again later.';
  }
  // UC 1.3 Exception 4b - SMTP Service Failure.
  if (axiosError.response?.status === 503) {
    return 'Service temporarily unavailable. Please try again later.';
  }
  if (!axiosError.response) {
    return 'System unavailable, please try again later.';
  }
  return axiosError.response?.data?.error?.message ?? fallback;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = useMemo(() => digits.join(''), [digits]);
  const codeComplete = code.length === OTP_LENGTH && digits.every((d) => d !== '');
  const expired = stage === 'code' && secondsLeft <= 0;

  // UC 1.3 Special Requirement #2 - the OTP is valid for 3 minutes; drive the visible countdown.
  useEffect(() => {
    if (stage !== 'code' || secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [stage, secondsLeft]);

  // Focus the first OTP box when the code stage opens.
  useEffect(() => {
    if (stage === 'code') {
      inputsRef.current[0]?.focus();
    }
  }, [stage]);

  function resetDigits() {
    setDigits(Array(OTP_LENGTH).fill(''));
  }

  async function requestCode(isResend: boolean) {
    setError(null);
    setInfo(null);
    if (isResend) setResending(true);
    else setLoading(true);
    try {
      const { data } = await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      const payload = data.data;
      if (!payload.emailFound) {
        setError('Bu e-posta adresi sistemde kayıtlı değil.');
        return;
      }
      setStage('code');
      resetDigits();
      // expiresInSeconds is null for an unknown email (enumeration-safe); fall back to 180s so the
      // UI is identical whether or not the email is registered.
      setSecondsLeft(payload.expiresInSeconds ?? 180);
      if (isResend) {
        setInfo('A new code has been sent.');
      }
      // Local dev only: backend echoes the code when dev-expose-code is enabled.
      // Auto-fill the OTP boxes so the developer doesn't need to copy-paste manually.
      if (payload.devVerificationCode) {
        setDevCode(payload.devVerificationCode);
        const chars = payload.devVerificationCode.slice(0, OTP_LENGTH).split('');
        const filled = Array(OTP_LENGTH).fill('');
        chars.forEach((c, i) => { filled[i] = c; });
        setDigits(filled);
        // Focus the last box to signal that the code is ready.
        setTimeout(() => inputsRef.current[OTP_LENGTH - 1]?.focus(), 0);
      } else if (isResend) {
        inputsRef.current[0]?.focus();
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not send the verification code. Please try again.'));
    } finally {
      setLoading(false);
      setResending(false);
    }
  }

  async function handleSendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    await requestCode(false);
  }

  async function handleVerify(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!codeComplete) {
      setError('Please enter the 6-digit code');
      return;
    }
    if (expired) {
      setError('The code has expired. Please request a new code.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.verifyResetCode({ email: email.trim().toLowerCase(), code });
      const { resetToken } = data.data;
      // UC 1.3 POST-2 -> carry the temporary reset token into UC 1.4 (kept out of the URL).
      navigate('/reset-password', { state: { resetToken, email: email.trim().toLowerCase() } });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid verification code'));
      resetDigits();
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handleDigitChange(index: number, value: string) {
    const clean = value.replace(/\D/g, '');
    // Support pasting the whole code into one box.
    if (clean.length > 1) {
      const chars = clean.slice(0, OTP_LENGTH).split('');
      const next = Array(OTP_LENGTH).fill('');
      chars.forEach((c, i) => { next[i] = c; });
      setDigits(next);
      const lastFilled = Math.min(chars.length, OTP_LENGTH) - 1;
      inputsRef.current[Math.min(lastFilled + 1, OTP_LENGTH - 1)]?.focus();
      return;
    }
    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    if (clean && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AuthBrandPanel />

      {/* Right panel */}
      <div style={s.rightPanel}>
        <div style={s.card}>
          <h2 style={s.title}>Identity Verification</h2>
          <p style={s.subtitle}>
            {stage === 'email'
              ? 'Enter your registered email address to receive a verification code.'
              : 'Please enter the 6-digit code sent to your registered email.'}
          </p>

          {error && <div style={s.serverError}>{error}</div>}
          {info && !error && <div style={s.infoBox}>{info}</div>}
          {devCode && (
            <div style={s.devBanner}>
              <span style={{ fontWeight: 700 }}>🛠 Dev — OTP:</span>{' '}
              <span style={{ fontFamily: 'monospace', letterSpacing: 2, fontWeight: 700 }}>{devCode}</span>
              <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.75 }}>(auto-filled)</span>
            </div>
          )}

          {stage === 'email' ? (
            <form onSubmit={handleSendCode} noValidate>
              <label style={s.label} htmlFor="reset-email">Email Address</label>
              <input
                id="reset-email"
                type="email"
                style={s.input}
                placeholder="student@std.iyte.edu.tr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />

              <button type="submit" disabled={loading} style={{ ...s.button, marginTop: 24 }}>
                {loading ? 'Sending…' : 'Send Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} noValidate>
              <label style={s.label} htmlFor="reset-email-verified">Email Address</label>
              <div style={s.verifiedRow}>
                <input
                  id="reset-email-verified"
                  type="email"
                  style={s.verifiedInput}
                  value={email}
                  readOnly
                />
                <span style={s.verifiedBadge}>✓ Verified</span>
              </div>

              <label style={{ ...s.label, marginTop: 20 }}>Verification Code</label>
              <div style={s.otpRow}>
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputsRef.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(i, e)}
                    style={{ ...s.otpBox, borderColor: digit ? PRIMARY : '#d1d5db' }}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              <div style={s.metaRow}>
                <span style={{ fontSize: 13, color: expired ? '#ef4444' : '#6b7280' }}>
                  {expired ? 'Code expired' : `Code expires in ${formatCountdown(secondsLeft)}`}
                </span>
                <button
                  type="button"
                  onClick={() => requestCode(true)}
                  disabled={resending}
                  style={s.resendLink}
                >
                  {resending ? 'Resending…' : 'Resend Code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !codeComplete || expired}
                style={{
                  ...s.button,
                  marginTop: 22,
                  opacity: loading || !codeComplete || expired ? 0.6 : 1,
                  cursor: loading || !codeComplete || expired ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Verifying…' : 'Verify & Continue'}
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <Link to="/login" style={s.backLink}>← Back to Login</Link>
          </div>
        </div>

        <p style={s.helpText}>
          Need help? Contact{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: PRIMARY, textDecoration: 'none' }}>
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </div>
  );
}

const s = {
  rightPanel: {
    width: '50%',
    minWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8fafc',
    padding: '2rem',
  } as React.CSSProperties,
  card: {
    width: '100%',
    maxWidth: 380,
    background: '#fff',
    borderRadius: 12,
    padding: '32px 28px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    border: '1px solid #eef0f3',
  } as React.CSSProperties,
  title: { margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#111827' } as React.CSSProperties,
  subtitle: { margin: '0 0 22px', fontSize: 13, color: '#6b7280', lineHeight: 1.5 } as React.CSSProperties,
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    fontSize: 14,
    background: '#f3f4f6',
    color: '#111827',
    boxSizing: 'border-box',
    outline: 'none',
  } as React.CSSProperties,
  verifiedRow: { position: 'relative', display: 'flex', alignItems: 'center' } as React.CSSProperties,
  verifiedInput: {
    width: '100%',
    padding: '10px 92px 10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    fontSize: 14,
    background: '#f3f4f6',
    color: '#111827',
    boxSizing: 'border-box',
    outline: 'none',
  } as React.CSSProperties,
  verifiedBadge: {
    position: 'absolute',
    right: 12,
    fontSize: 13,
    fontWeight: 600,
    color: '#16a34a',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  otpRow: { display: 'flex', gap: 8, justifyContent: 'space-between' } as React.CSSProperties,
  otpBox: {
    width: 48,
    height: 54,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 600,
    color: '#111827',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  } as React.CSSProperties,
  resendLink: {
    background: 'none',
    border: 'none',
    color: PRIMARY,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    padding: 0,
  } as React.CSSProperties,
  button: {
    width: '100%',
    padding: '12px',
    background: PRIMARY,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  backLink: { fontSize: 13, color: '#6b7280', textDecoration: 'none' } as React.CSSProperties,
  serverError: {
    background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6,
    padding: '10px 12px', fontSize: 13, color: '#b91c1c', marginBottom: 16,
  } as React.CSSProperties,
  infoBox: {
    background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 6,
    padding: '10px 12px', fontSize: 13, color: '#1d4ed8', marginBottom: 16,
  } as React.CSSProperties,
  helpText: { marginTop: 22, fontSize: 12, color: '#9ca3af' } as React.CSSProperties,
  devBanner: {
    background: '#fefce8', border: '1px solid #fde047', borderRadius: 6,
    padding: '8px 12px', fontSize: 13, color: '#713f12', marginBottom: 16,
  } as React.CSSProperties,
};
