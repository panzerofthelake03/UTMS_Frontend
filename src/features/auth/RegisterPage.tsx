import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerThunk, clearError } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../shared/hooks';
import iyteLogo from '../../assets/iyte-logo.png';

interface FormValues {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error, user } = useAppSelector((s) => s.auth);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  useEffect(() => {
    if (user) navigate('/student/dashboard', { replace: true });
    return () => { dispatch(clearError()); };
  }, [user, navigate, dispatch]);

  function onSubmit(values: FormValues) {
    dispatch(registerThunk(values));
  }

  return (
    <div style={styles.page}>
      <form onSubmit={handleSubmit(onSubmit)} style={styles.card} noValidate>
        <img src={iyteLogo} alt="IYTE logo" style={styles.logo} />
        <h1 style={styles.title}>Create Account</h1>

        {error && <div style={styles.serverError}>{error}</div>}

        <label style={styles.label} htmlFor="firstName">First Name</label>
        <input id="firstName" style={styles.input} {...register('firstName', { required: 'Required' })} />
        {errors.firstName && <span style={styles.fieldError}>{errors.firstName.message}</span>}

        <label style={styles.label} htmlFor="lastName">Last Name</label>
        <input id="lastName" style={styles.input} {...register('lastName', { required: 'Required' })} />
        {errors.lastName && <span style={styles.fieldError}>{errors.lastName.message}</span>}

        <label style={styles.label} htmlFor="email">Email</label>
        <input id="email" type="email" style={styles.input} {...register('email', { required: 'Required' })} />
        {errors.email && <span style={styles.fieldError}>{errors.email.message}</span>}

        <label style={styles.label} htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          style={styles.input}
          {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })}
        />
        {errors.password && <span style={styles.fieldError}>{errors.password.message}</span>}

        <button type="submit" disabled={status === 'loading'} style={styles.button}>
          {status === 'loading' ? 'Registering…' : 'Register'}
        </button>

        <p style={{ marginTop: 12, fontSize: 13, textAlign: 'center' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' } as React.CSSProperties,
  card: { background: '#fff', padding: '2rem', borderRadius: 8, boxShadow: '0 2px 16px rgba(0,0,0,0.1)', width: 360, display: 'flex', flexDirection: 'column' as const, gap: 6 },
  logo: { width: 88, height: 88, objectFit: 'contain', marginBottom: 8, alignSelf: 'center' } as React.CSSProperties,
  title: { margin: '0 0 1rem', fontSize: 22, color: '#1d3c6e', textAlign: 'center' as const },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 } as React.CSSProperties,
  fieldError: { fontSize: 12, color: '#ef4444' },
  serverError: { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4, padding: '8px 10px', fontSize: 13, color: '#b91c1c' },
  button: { marginTop: 8, padding: '10px', background: '#1d3c6e', color: '#fff', border: 'none', borderRadius: 4, fontSize: 15, cursor: 'pointer', fontWeight: 600 } as React.CSSProperties,
};
