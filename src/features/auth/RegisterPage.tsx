import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerThunk, clearError } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../shared/hooks';
import iyteLogo from '../../assets/iyte-logo.png';
import type { RegisterRequest } from '../../shared/api/authApi';

interface FormValues {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  nationality: string;
  identityDocumentType: 'TC_ID' | 'PASSPORT';
  dateOfBirth: string;
  tcIdentityNumber?: string;
  identitySerialNo?: string;
  passportNumber?: string;
  passportExpirationDate?: string;
  currentProgram: string;
  currentUniversity: string;
}

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error, user } = useAppSelector((s) => s.auth);
  const {
    register,
    watch,
    setError,
    clearErrors,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      nationality: 'TURKISH',
      identityDocumentType: 'TC_ID',
    },
  });

  const documentType = watch('identityDocumentType');
  const passwordValue = watch('password');

  useEffect(() => {
    if (user) navigate('/student/dashboard', { replace: true });
    return () => { dispatch(clearError()); };
  }, [user, navigate, dispatch]);

  function parseDdMmYyyy(value: string): string | null {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
    if (!match) return null;
    const [, dd, mm, yyyy] = match;
    const iso = `${yyyy}-${mm}-${dd}`;
    const d = new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return null;
    if (d.getUTCFullYear() !== Number(yyyy) || d.getUTCMonth() + 1 !== Number(mm) || d.getUTCDate() !== Number(dd)) {
      return null;
    }
    return iso;
  }

  function onSubmit(values: FormValues) {
    clearErrors(['dateOfBirth', 'passportExpirationDate', 'identityDocumentType', 'confirmPassword']);

    if (values.password !== values.confirmPassword) {
      setError('confirmPassword', { type: 'manual', message: 'Passwords do not match' });
      return;
    }

    if (values.nationality === 'TURKISH' && values.identityDocumentType !== 'TC_ID') {
      setError('identityDocumentType', { type: 'manual', message: 'Turkish nationality must use National ID (TC)' });
      return;
    }
    if (values.nationality !== 'TURKISH' && values.identityDocumentType !== 'PASSPORT') {
      setError('identityDocumentType', { type: 'manual', message: 'Non-Turkish nationality must use Passport' });
      return;
    }

    const birthIso = parseDdMmYyyy(values.dateOfBirth);
    if (!birthIso) {
      setError('dateOfBirth', { type: 'manual', message: 'Use DD/MM/YYYY format' });
      return;
    }

    const payload: RegisterRequest = {
      email: values.email,
      password: values.password,
      firstName: values.firstName,
      lastName: values.lastName,
      nationality: values.nationality,
      identityDocumentType: values.identityDocumentType,
      dateOfBirth: birthIso,
      currentProgram: values.currentProgram,
      currentUniversity: values.currentUniversity,
      tcIdentityNumber: values.identityDocumentType === 'TC_ID' ? values.tcIdentityNumber : undefined,
      identitySerialNo: values.identityDocumentType === 'TC_ID' ? values.identitySerialNo : undefined,
      passportNumber: values.identityDocumentType === 'PASSPORT' ? values.passportNumber : undefined,
      passportExpirationDate: undefined,
    };

    if (values.identityDocumentType === 'PASSPORT') {
      const passportExpiryIso = parseDdMmYyyy(values.passportExpirationDate ?? '');
      if (!passportExpiryIso) {
        setError('passportExpirationDate', { type: 'manual', message: 'Use DD/MM/YYYY format' });
        return;
      }
      payload.passportExpirationDate = passportExpiryIso;
    }

    dispatch(registerThunk(payload));
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

        <label style={styles.label} htmlFor="nationality">Nationality</label>
        <select id="nationality" style={styles.input} {...register('nationality', { required: 'Required' })}>
          <option value="TURKISH">Turkish</option>
          <option value="NON_TURKISH">Non-Turkish</option>
        </select>
        {errors.nationality && <span style={styles.fieldError}>{errors.nationality.message}</span>}

        <label style={styles.label} htmlFor="dateOfBirth">Date of Birth (DD/MM/YYYY)</label>
        <input
          id="dateOfBirth"
          placeholder="DD/MM/YYYY"
          style={styles.input}
          {...register('dateOfBirth', {
            required: 'Required',
            pattern: { value: /^\d{2}\/\d{2}\/\d{4}$/, message: 'Use DD/MM/YYYY format' },
          })}
        />
        {errors.dateOfBirth && <span style={styles.fieldError}>{errors.dateOfBirth.message}</span>}

        <label style={styles.label} htmlFor="identityDocumentType">Identity Document Type</label>
        <select id="identityDocumentType" style={styles.input} {...register('identityDocumentType', { required: 'Required' })}>
          <option value="TC_ID">National ID (TC)</option>
          <option value="PASSPORT">Passport</option>
        </select>
        {errors.identityDocumentType && <span style={styles.fieldError}>{errors.identityDocumentType.message}</span>}

        {documentType === 'TC_ID' && (
          <>
            <label style={styles.label} htmlFor="tcIdentityNumber">TC Identity Number</label>
            <input
              id="tcIdentityNumber"
              style={styles.input}
              {...register('tcIdentityNumber', {
                required: 'Required',
                pattern: { value: /^\d{11}$/, message: 'TC identity number must be 11 digits' },
              })}
            />
            {errors.tcIdentityNumber && <span style={styles.fieldError}>{errors.tcIdentityNumber.message}</span>}

            <label style={styles.label} htmlFor="identitySerialNo">Identity Serial No</label>
            <input id="identitySerialNo" style={styles.input} {...register('identitySerialNo', { required: 'Required' })} />
            {errors.identitySerialNo && <span style={styles.fieldError}>{errors.identitySerialNo.message}</span>}
          </>
        )}

        {documentType === 'PASSPORT' && (
          <>
            <label style={styles.label} htmlFor="passportNumber">Passport Number</label>
            <input id="passportNumber" style={styles.input} {...register('passportNumber', { required: 'Required' })} />
            {errors.passportNumber && <span style={styles.fieldError}>{errors.passportNumber.message}</span>}

            <label style={styles.label} htmlFor="passportExpirationDate">Passport Expiration Date (DD/MM/YYYY)</label>
            <input
              id="passportExpirationDate"
              placeholder="DD/MM/YYYY"
              style={styles.input}
              {...register('passportExpirationDate', {
                required: 'Required',
                pattern: { value: /^\d{2}\/\d{2}\/\d{4}$/, message: 'Use DD/MM/YYYY format' },
              })}
            />
            {errors.passportExpirationDate && <span style={styles.fieldError}>{errors.passportExpirationDate.message}</span>}
          </>
        )}

        <label style={styles.label} htmlFor="currentProgram">Current Program</label>
        <input id="currentProgram" style={styles.input} {...register('currentProgram', { required: 'Required' })} />
        {errors.currentProgram && <span style={styles.fieldError}>{errors.currentProgram.message}</span>}

        <label style={styles.label} htmlFor="currentUniversity">Current University</label>
        <input id="currentUniversity" style={styles.input} {...register('currentUniversity', { required: 'Required' })} />
        {errors.currentUniversity && <span style={styles.fieldError}>{errors.currentUniversity.message}</span>}

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

        <label style={styles.label} htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          style={styles.input}
          {...register('confirmPassword', {
            required: 'Required',
            validate: (value) => value === passwordValue || 'Passwords do not match',
          })}
        />
        {errors.confirmPassword && <span style={styles.fieldError}>{errors.confirmPassword.message}</span>}

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
  card: {
    background: '#fff',
    padding: '2rem',
    borderRadius: 8,
    boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
    width: 420,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
    maxHeight: '92vh',
    overflowY: 'auto' as const,
  },
  logo: { width: 88, height: 88, objectFit: 'contain', marginBottom: 8, alignSelf: 'center' } as React.CSSProperties,
  title: { margin: '0 0 1rem', fontSize: 22, color: '#1d3c6e', textAlign: 'center' as const },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 } as React.CSSProperties,
  fieldError: { fontSize: 12, color: '#ef4444' },
  serverError: { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4, padding: '8px 10px', fontSize: 13, color: '#b91c1c' },
  button: { marginTop: 8, padding: '10px', background: '#1d3c6e', color: '#fff', border: 'none', borderRadius: 4, fontSize: 15, cursor: 'pointer', fontWeight: 600 } as React.CSSProperties,
};
