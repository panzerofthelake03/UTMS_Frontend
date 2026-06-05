import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { authApi } from '../../shared/api/authApi';
import AuthBrandPanel, { AUTH_PRIMARY as PRIMARY } from './AuthBrandPanel';

const REDIRECT_SECONDS = 3;

interface ResetState {
  resetToken?: string;
  email?: string;
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<{ error?: { message?: string } }>;
  if (axiosError.code === 'ECONNABORTED') {
    return 'Server is taking too long to respond. Please try again later.';
  }
  if (!axiosError.response) {
    return 'System unavailable, please try again later.';
  }
  return axiosError.response?.data?.error?.message ?? fallback;
}

// UC 1.4 Special Requirement #1 - mirror the backend complexity rule for instant client feedback.
function clientComplexityError(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/\d/.test(password)) return 'Password must contain at least one digit.';
  return null;
}

function EyeIcon({ off }: { off: boolean }) {
  if (off) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/**
 * UC 1.4 - Reset Password.
 *
 * Requires the temporary reset token from UC 1.3 (passed via router state). On success shows
 * "Password Changed Successfully" then redirects to Login after 3 seconds. A 410 (session/token
 * expiry) sends the user back to the start of UC 1.3.
 */
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

  // UC 1.4 PRE-1 - reaching this page requires a verified reset token from UC 1.3.
  useEffect(() => {
    if (!resetToken) {
      navigate('/forgot-password', { replace: true });
    }
  }, [resetToken, navigate]);

  // Normal Course step 7 - redirect to login a few seconds after success.
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate('/login', { replace: true }), REDIRECT_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!resetToken) {
      navigate('/forgot-password', { replace: true });
      return;
    }

    // Alternative Course 4a - Password Mismatch (client pre-check).
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setNewPassword('');
      setConfirmPassword('');
      return;
    }

    // Alternative Course 4b - Weak Password (client pre-check; backend re-validates).
    const complexityError = clientComplexityError(newPassword);
    if (complexityError) {
      setError(complexityError);
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ resetToken, newPassword, confirmPassword });
      setSuccess(true);
    } catch (err) {
      const axiosError = err as AxiosError;
      // Alternative Course 4d - Session/Token Expiry: backend returns 410 GONE.
      if (axiosError.response?.status === 410) {
        setError('Session expired. Please restart the process.');
        setTimeout(() => navigate('/forgot-password', { replace: true }), 2000);
        return;
      }
      // Alternative 4c (history), Exception 5a (DB error) and any other backend message land here.
      setError(getApiErrorMessage(err, 'Password could not be updated. Please try again.'));
      // The use case clears the fields and returns to step 2 on validation failures.
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <AuthBrandPanel />
        <div style={s.rightPanel}>
          <div style={s.formWrap}>
            <div style={s.successIcon}>✓</div>
            <h2 style={s.title}>Password Changed Successfully</h2>
            <p style={s.subtitle}>Your password has been updated. Redirecting you to the login page…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AuthBrandPanel />

      {/* Right panel */}
      <div style={s.rightPanel}>
        <form onSubmit={handleSubmit} style={s.formWrap} noValidate>
          <h2 style={s.title}>Reset Your Password</h2>
          <p style={s.subtitle}>Please create a new, strong password for your account.</p>

          {error && <div style={s.serverError}>{error}</div>}

          <label style={s.label} htmlFor="new-password">
            New Password <span style={s.required}>*</span>
          </label>
          <div style={s.inputWrap}>
            <input
              id="new-password"
              type={showNew ? 'text' : 'password'}
              style={s.input}
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              style={s.eyeButton}
              aria-label={showNew ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              <EyeIcon off={showNew} />
            </button>
          </div>

          <label style={{ ...s.label, marginTop: 18 }} htmlFor="confirm-password">
            Confirm New Password <span style={s.required}>*</span>
          </label>
          <div style={s.inputWrap}>
            <input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              style={s.input}
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              style={s.eyeButton}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              <EyeIcon off={showConfirm} />
            </button>
          </div>

          <button type="submit" disabled={loading} style={{ ...s.button, marginTop: 26, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Setting Password…' : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  rightPanel: {
    width: '50%',
    minWidth: 400,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    padding: '2rem',
  } as React.CSSProperties,
  formWrap: { width: '100%', maxWidth: 360 } as React.CSSProperties,
  title: { margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: '#111827' } as React.CSSProperties,
  subtitle: { margin: '0 0 26px', fontSize: 14, color: '#6b7280', lineHeight: 1.5 } as React.CSSProperties,
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 } as React.CSSProperties,
  required: { color: '#ef4444' } as React.CSSProperties,
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '11px 42px 11px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    fontSize: 14,
    background: '#fff',
    color: '#111827',
    boxSizing: 'border-box',
    outline: 'none',
  } as React.CSSProperties,
  eyeButton: {
    position: 'absolute',
    right: 10,
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
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
  serverError: {
    background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6,
    padding: '10px 12px', fontSize: 13, color: '#b91c1c', marginBottom: 16,
  } as React.CSSProperties,
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: '#dcfce7',
    color: '#16a34a',
    fontSize: 30,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  } as React.CSSProperties,
};
