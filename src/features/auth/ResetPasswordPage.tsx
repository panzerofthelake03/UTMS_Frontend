import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { authApi } from '../../shared/api/authApi';
import AuthBrandPanel from './AuthBrandPanel';

const REDIRECT_SECONDS = 3;

interface ResetState { resetToken?: string; email?: string }

function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<{ error?: { message?: string } }>;
  if (axiosError.code === 'ECONNABORTED') return 'Server is taking too long to respond. Please try again later.';
  if (!axiosError.response) return 'System unavailable, please try again later.';
  return axiosError.response?.data?.error?.message ?? fallback;
}

function clientComplexityError(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/\d/.test(password)) return 'Password must contain at least one digit.';
  return null;
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as ResetState;
  const resetToken = state.resetToken;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!resetToken) navigate('/forgot-password', { replace: true });
  }, [resetToken, navigate]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate('/login', { replace: true }), REDIRECT_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (!resetToken) { navigate('/forgot-password', { replace: true }); return; }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match'); setNewPassword(''); setConfirmPassword(''); return;
    }
    const complexityError = clientComplexityError(newPassword);
    if (complexityError) { setError(complexityError); return; }
    setLoading(true);
    try {
      await authApi.resetPassword({ resetToken, newPassword, confirmPassword });
      setSuccess(true);
    } catch (err) {
      const axiosError = err as AxiosError;
      if (axiosError.response?.status === 410) {
        setError('Session expired. Please restart the process.');
        setTimeout(() => navigate('/forgot-password', { replace: true }), 2000);
        return;
      }
      setError(getApiErrorMessage(err, 'Password could not be updated. Please try again.'));
      setNewPassword(''); setConfirmPassword('');
    } finally { setLoading(false); }
  }

  if (success) {
    return (
      <div className="flex min-h-screen">
        <AuthBrandPanel />
        <div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 text-3xl font-bold flex items-center justify-center mx-auto mb-5">✓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Changed Successfully</h2>
            <p className="text-sm text-gray-500">Your password has been updated. Redirecting to login…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel />

      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 md:px-16">
        <form onSubmit={handleSubmit} className="w-full max-w-md" noValidate>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Reset Your Password</h2>
          <p className="text-sm text-gray-500 mb-8">Please create a new, strong password for your account.</p>
          <p className="text-xs text-gray-400 mb-6">
            Password must be at least 8 characters with uppercase, lowercase, and numbers
          </p>

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="new-password">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                placeholder="Enter your new password"
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a] transition"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
              />
              <button type="button" onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNew ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="confirm-password">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter your new password"
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a] transition"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#8b1a1a] hover:bg-[#6b1414] text-white font-semibold text-sm transition disabled:opacity-60"
          >
            {loading ? 'Setting Password…' : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
