import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { login, clearError } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../shared/hooks';
import type { UserRole } from '../../store/authSlice';
import iyteLogo from '../../assets/iyte-logo.png';

interface FormValues { email: string; password: string }

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
    <div style={styles.page}>
      <form onSubmit={handleSubmit(onSubmit)} style={styles.card} noValidate>
        <img src={iyteLogo} alt="IYTE logo" style={styles.logo} />
        <h1 style={styles.title}>UTMS Login</h1>

        {error && <div style={styles.serverError}>{error}</div>}

        <label style={styles.label} htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          style={styles.input}
          {...register('email', { required: 'Email is required' })}
        />
        {errors.email && <span style={styles.fieldError}>{errors.email.message}</span>}

        <label style={styles.label} htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          style={styles.input}
          {...register('password', { required: 'Password is required' })}
        />
        {errors.password && <span style={styles.fieldError}>{errors.password.message}</span>}

        <button type="submit" disabled={status === 'loading'} style={styles.button}>
          {status === 'loading' ? 'Signing in…' : 'Sign in'}
        </button>

        <p style={{ marginTop: 12, fontSize: 13, textAlign: 'center' }}>
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f3f4f6',
  } as React.CSSProperties,
  card: {
    background: '#fff',
    padding: '2rem',
    borderRadius: 8,
    boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
    width: 360,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  logo: { width: 88, height: 88, objectFit: 'contain', marginBottom: 8, alignSelf: 'center' } as React.CSSProperties,
  title: { margin: '0 0 1rem', fontSize: 22, color: '#1d3c6e', textAlign: 'center' as const },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: {
    padding: '8px 10px',
    border: '1px solid #d1d5db',
    borderRadius: 4,
    fontSize: 14,
    outline: 'none',
  } as React.CSSProperties,
  fieldError: { fontSize: 12, color: '#ef4444' },
  serverError: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: 4,
    padding: '8px 10px',
    fontSize: 13,
    color: '#b91c1c',
  },
  button: {
    marginTop: 8,
    padding: '10px',
    background: '#1d3c6e',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 15,
    cursor: 'pointer',
    fontWeight: 600,
  } as React.CSSProperties,
};
