import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { login, clearError } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../shared/hooks';
import type { UserRole } from '../../store/authSlice';
import iyteLogo from '../../assets/iyte-logo.png';

interface FormValues { email: string; password: string }

const PRIMARY = '#8B1A1A';

function roleHome(role: UserRole): string {
  switch (role) {
    case 'ROLE_STUDENT': return '/student/dashboard';
    case 'ROLE_OIDB': return '/admin/oidb/applications';
    case 'ROLE_YDYO': return '/admin/ydyo/applications';
    case 'ROLE_YGK': return '/admin/ygk/applications';
    case 'ROLE_INTIBAK': return '/admin/intibak/applications';
    case 'ROLE_ADMIN': return '/admin/oidb/applications';
  }
}

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error, user } = useAppSelector((s) => s.auth);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  useEffect(() => {
    if (user) navigate(roleHome(user.role), { replace: true });
    return () => { dispatch(clearError()); };
  }, [user, navigate, dispatch]);

  function onSubmit(values: FormValues) {
    dispatch(login(values));
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left panel */}
      <div style={{
        flex: 1,
        background: PRIMARY,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '2rem',
      }}>
        {/* Decorative shapes */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: -80, left: -100, width: 380, height: 380, border: '50px solid rgba(255,255,255,0.06)', borderRadius: 50, transform: 'rotate(20deg)' }} />
          <div style={{ position: 'absolute', top: -50, left: -60, width: 280, height: 280, border: '35px solid rgba(255,255,255,0.04)', borderRadius: 36, transform: 'rotate(10deg)' }} />
          <div style={{ position: 'absolute', bottom: -100, right: -80, width: 420, height: 420, border: '55px solid rgba(255,255,255,0.06)', borderRadius: 60, transform: 'rotate(-15deg)' }} />
          <div style={{ position: 'absolute', bottom: -70, right: -50, width: 320, height: 320, border: '40px solid rgba(255,255,255,0.04)', borderRadius: 44, transform: 'rotate(-8deg)' }} />
        </div>
        {/* Branding */}
        <div style={{ position: 'relative', textAlign: 'center', color: '#fff' }}>
          <img src={iyteLogo} alt="IYTE logo" style={{ width: 100, height: 100, borderRadius: '50%', background: '#fff', padding: 8, objectFit: 'contain', marginBottom: 24 }} />
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, lineHeight: 1.3 }}>Izmir Institute of Technology</h1>
          <p style={{ margin: '10px 0 6px', fontSize: 14, opacity: 0.85 }}>Undergraduate Transfer Management System</p>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.6, letterSpacing: 3 }}>UTMS</p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        width: '50%',
        minWidth: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        padding: '2rem',
      }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%', maxWidth: 400 }} noValidate>
          <h2 style={{ margin: '0 0 6px', fontSize: 30, fontWeight: 700, color: '#111827' }}>Login</h2>
          <p style={{ margin: '0 0 28px', fontSize: 14, color: '#6b7280' }}>Enter your credentials to access your account</p>

          {error && <div style={s.serverError}>{error}</div>}

          <label style={s.label} htmlFor="email">Email or Username</label>
          <input
            id="email"
            type="email"
            style={s.input}
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && <span style={s.fieldError}>{errors.email.message}</span>}

          <label style={{ ...s.label, marginTop: 16 }} htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            style={s.input}
            {...register('password', { required: 'Password is required' })}
          />
          {errors.password && <span style={s.fieldError}>{errors.password.message}</span>}

          <div style={{ textAlign: 'right', marginTop: 8, marginBottom: 24 }}>
            <a href="#" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>Forgot Password?</a>
          </div>

          <button type="submit" disabled={status === 'loading'} style={s.button}>
            {status === 'loading' ? 'Signing in…' : 'Login'}
          </button>

          <p style={{ marginTop: 20, fontSize: 13, textAlign: 'center', color: '#6b7280' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: PRIMARY, fontWeight: 700, textDecoration: 'none' }}>Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

const s = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    fontSize: 14,
    background: '#f3f4f6',
    boxSizing: 'border-box',
    outline: 'none',
  } as React.CSSProperties,
  fieldError: { display: 'block', fontSize: 12, color: '#ef4444', marginTop: 4 } as React.CSSProperties,
  serverError: {
    background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6,
    padding: '10px 12px', fontSize: 13, color: '#b91c1c', marginBottom: 16,
  } as React.CSSProperties,
  button: {
    width: '100%', padding: '12px', background: PRIMARY, color: '#fff',
    border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: 'pointer',
  } as React.CSSProperties,
};

