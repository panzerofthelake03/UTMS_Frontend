import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { login, clearError } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../shared/hooks';
import type { UserRole } from '../../store/authSlice';
import iyteLogo from '../../assets/iyte-logo.png';
import heroBg from '../../assets/hero.png';

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
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user) navigate(roleHome(user.role), { replace: true });
    return () => { dispatch(clearError()); };
  }, [user, navigate, dispatch]);

  useEffect(() => {
    if (error) {
      setValue('password', '');
    }
  }, [error, setValue]);

  function onSubmit(values: FormValues) {
    dispatch(login(values));
  }

  return (
    <div style={{ ...styles.page, flexDirection: isMobile ? 'column' : 'row' }}>
      {/* Left Panel */}
      {!isMobile && (
        <div style={styles.leftPanel}>
          <div style={styles.overlay}>
            <img src={iyteLogo} alt="IYTE logo" style={styles.largeLogo} />
            <h2 style={styles.instTitle}>Izmir Institute of Technology</h2>
            <p style={styles.sysName}>Undergraduate Transfer Management System</p>
            <p style={styles.sysAbbr}>UTMS</p>
          </div>
        </div>
      )}

      {/* Right Panel */}
      <div style={{ ...styles.rightPanel, padding: isMobile ? '1rem' : '2rem' }}>
        <div style={{ ...styles.formContainer, padding: isMobile ? '1rem' : '2rem' }}>
          {isMobile && (
            <div style={styles.mobileLogo}>
              <img src={iyteLogo} alt="IYTE logo" style={{ width: 60, height: 60, marginBottom: '1rem' }} />
            </div>
          )}
          <h1 style={{ ...styles.title, fontSize: isMobile ? '1.5rem' : '2rem' }}>Login</h1>
          <p style={styles.subtitle}>Enter your credentials to access your account</p>

          <form onSubmit={handleSubmit(onSubmit)} style={styles.form} noValidate>
            {error && <div style={styles.serverError}>{error}</div>}

            <label style={styles.label} htmlFor="email">Email or Username</label>
            <input
              id="email"
              type="text"
              placeholder="Enter your email or username"
              style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
              {...register('email', { required: 'Email or Username is required' })}
            />
            {errors.email && <span style={styles.fieldError}>{errors.email.message}</span>}

            <label style={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              style={{ ...styles.input, ...(errors.password ? styles.inputError : {}) }}
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <span style={styles.fieldError}>{errors.password.message}</span>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4, marginBottom: 12 }}>
              <Link to="/forgot-password" style={styles.forgotLink}>Forgot Password?</Link>
            </div>

            <button type="submit" disabled={status === 'loading'} style={styles.button}>
              {status === 'loading' ? 'Logging in…' : 'Login'}
            </button>

            <p style={styles.registerText}>
              Don't have an account? <Link to="/register" style={styles.registerLink}>Register</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    background: '#fff',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
  } as React.CSSProperties,
  leftPanel: {
    flex: 1,
    backgroundImage: `url(${heroBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative' as const,
    minHeight: '100vh',
    display: 'flex',
  },
  overlay: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(140, 21, 21, 0.85)', // Dark red overlay
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    textAlign: 'center' as const,
    padding: '2rem'
  },
  largeLogo: {
    width: 140,
    height: 140,
    objectFit: 'contain' as const,
    marginBottom: '2rem',
  },
  mobileLogo: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  instTitle: {
    fontSize: '2.5rem',
    fontWeight: 600,
    margin: '0 0 1rem 0',
    color: '#ffffff',
  },
  sysName: {
    fontSize: '1.2rem',
    margin: '0 0 0.5rem 0',
    fontWeight: 300,
    color: '#ffffff',
  },
  sysAbbr: {
    fontSize: '1rem',
    margin: 0,
    fontWeight: 300,
    color: '#ffffff',
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    margin: '0 0 0.5rem',
    fontSize: '2rem',
    color: '#333',
    fontWeight: 500
  },
  subtitle: {
    color: '#666',
    fontSize: '0.9rem',
    marginBottom: '2rem',
    marginTop: 0
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.8rem',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: '#444',
  },
  input: {
    padding: '12px 14px',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  inputError: {
    borderColor: '#ef4444'
  },
  fieldError: { fontSize: '0.8rem', color: '#ef4444', marginTop: '-0.5rem' },
  serverError: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: 6,
    padding: '10px',
    fontSize: '0.9rem',
    color: '#b91c1c',
    marginBottom: '1rem',
  },
  forgotLink: {
    fontSize: '0.85rem',
    color: '#666',
    textDecoration: 'none',
  },
  button: {
    marginTop: '0.5rem',
    padding: '12px',
    background: '#8c1515', // Matches the red theme
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
  registerText: {
    marginTop: '1.5rem',
    fontSize: '0.9rem',
    textAlign: 'center' as const,
    color: '#666'
  },
  registerLink: {
    color: '#8c1515',
    fontWeight: 600,
    textDecoration: 'none'
  }
};
