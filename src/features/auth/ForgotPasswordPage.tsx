import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { authApi } from '../../shared/api/authApi';
import AuthBrandPanel from './AuthBrandPanel';

const OTP_LENGTH = 6;
const SUPPORT_EMAIL = 'support@iyte.edu.tr';
type Stage = 'email' | 'code';

function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<{ error?: { message?: string } }>;
  if (axiosError.code === 'ECONNABORTED') return 'Server is taking too long to respond. Please try again later.';
  if (axiosError.response?.status === 503) return 'Service temporarily unavailable. Please try again later.';
  if (!axiosError.response) return 'System unavailable, please try again later.';
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

  useEffect(() => {
    if (stage !== 'code' || secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((p) => (p <= 1 ? 0 : p - 1)), 1000);
    return () => clearInterval(timer);
  }, [stage, secondsLeft]);

  useEffect(() => {
    if (stage === 'code') inputsRef.current[0]?.focus();
  }, [stage]);

  function resetDigits() { setDigits(Array(OTP_LENGTH).fill('')); }

  async function requestCode(isResend: boolean) {
    setError(null); setInfo(null);
    if (isResend) setResending(true); else setLoading(true);
    try {
      const { data } = await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      const payload = data.data;
      if (!payload.emailFound) { setError('Bu e-posta adresi sistemde kayıtlı değil.'); return; }
      setStage('code'); resetDigits();
      setSecondsLeft(payload.expiresInSeconds ?? 180);
      if (isResend) setInfo('A new code has been sent.');
      if (payload.devVerificationCode) {
        setDevCode(payload.devVerificationCode);
        const chars = payload.devVerificationCode.slice(0, OTP_LENGTH).split('');
        const filled = Array(OTP_LENGTH).fill('');
        chars.forEach((c, i) => { filled[i] = c; });
        setDigits(filled);
        setTimeout(() => inputsRef.current[OTP_LENGTH - 1]?.focus(), 0);
      } else if (isResend) { inputsRef.current[0]?.focus(); }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not send the verification code. Please try again.'));
    } finally { setLoading(false); setResending(false); }
  }

  async function handleSendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    await requestCode(false);
  }

  async function handleVerify(e?: React.FormEvent) {
    e?.preventDefault(); setError(null);
    if (!codeComplete) { setError('Please enter the 6-digit code'); return; }
    if (expired) { setError('The code has expired. Please request a new code.'); return; }
    setLoading(true);
    try {
      const { data } = await authApi.verifyResetCode({ email: email.trim().toLowerCase(), code });
      navigate('/reset-password', { state: { resetToken: data.data.resetToken, email: email.trim().toLowerCase() } });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid verification code'));
      resetDigits(); inputsRef.current[0]?.focus();
    } finally { setLoading(false); }
  }

  function handleDigitChange(index: number, value: string) {
    const clean = value.replace(/\D/g, '');
    if (clean.length > 1) {
      const chars = clean.slice(0, OTP_LENGTH).split('');
      const next = Array(OTP_LENGTH).fill('');
      chars.forEach((c, i) => { next[i] = c; });
      setDigits(next);
      inputsRef.current[Math.min(chars.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    setDigits((prev) => { const next = [...prev]; next[index] = clean; return next; });
    if (clean && index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputsRef.current[index - 1]?.focus();
    else if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus();
    else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  }

  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel />

      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 md:px-16">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Identity Verification</h2>
          <p className="text-sm text-gray-500 mb-8">
            {stage === 'email'
              ? 'Enter your registered email address to receive a verification code.'
              : 'Please enter the 6-digit code sent to your registered email.'}
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          {info && !error && (
            <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">{info}</div>
          )}
          {devCode && (
            <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-300 px-4 py-3 text-sm text-yellow-800">
              <span className="font-bold">🛠 Dev — OTP:</span>{' '}
              <span className="font-mono font-bold tracking-widest">{devCode}</span>
              <span className="ml-2 text-xs opacity-70">(auto-filled)</span>
            </div>
          )}

          {stage === 'email' ? (
            <form onSubmit={handleSendCode} noValidate>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="reset-email">
                Email Address
              </label>
              <input
                id="reset-email"
                type="email"
                placeholder="student@std.iyte.edu.tr"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a] transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full py-3 rounded-lg bg-[#8b1a1a] hover:bg-[#6b1414] text-white font-semibold text-sm transition disabled:opacity-60"
              >
                {loading ? 'Sending…' : 'Send Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} noValidate>
              {/* Verified email */}
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative mb-5">
                <input
                  type="email"
                  className="w-full px-4 py-2.5 pr-24 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500"
                  value={email}
                  readOnly
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-green-600">
                  ✓ Verified
                </span>
              </div>

              {/* OTP boxes */}
              <label className="block text-sm font-semibold text-gray-700 mb-2">Verification Code</label>
              <div className="flex gap-2 justify-between mb-3">
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
                    className={`w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 transition focus:outline-none focus:border-[#8b1a1a] ${
                      digit ? 'border-[#8b1a1a] bg-[#8b1a1a]/5' : 'border-gray-200 bg-white'
                    }`}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className={`text-xs font-medium ${expired ? 'text-red-500' : 'text-gray-500'}`}>
                  {expired ? 'Code expired' : `Code expires in ${formatCountdown(secondsLeft)}`}
                </span>
                <button
                  type="button"
                  onClick={() => void requestCode(true)}
                  disabled={resending}
                  className="text-xs font-bold text-[#8b1a1a] hover:underline disabled:opacity-50"
                >
                  {resending ? 'Resending…' : 'Resend Code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !codeComplete || expired}
                className="w-full py-3 rounded-lg bg-[#8b1a1a] hover:bg-[#6b1414] text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying…' : 'Verify & Continue'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-[#8b1a1a] transition">
              ← Back to Login
            </Link>
          </div>
        </div>

        <p className="absolute bottom-6 text-xs text-gray-400">
          Need help? Contact{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#8b1a1a] hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </div>
  );
}
