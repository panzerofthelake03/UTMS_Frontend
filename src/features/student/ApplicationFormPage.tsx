import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { applicationApi } from '../../shared/api/applicationApi';
import { useState, useEffect } from 'react';

interface FormValues { term: string; applicationNote: string }

const TERMS = ['2026-FALL', '2026-SPRING', '2027-FALL', '2027-SPRING'];

export default function ApplicationFormPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await applicationApi.create(values);
      navigate(`/student/applications/${res.data.data.id}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setServerError(err.response?.data?.error?.message ?? 'Failed to create application.');
    }
  }

  return (
    <div style={{ maxWidth: 540, width: '100%', padding: isMobile ? '0' : '0' }}>
      <h2 style={{ fontSize: isMobile ? '1.5rem' : '2rem' }}>New Application</h2>
      {serverError && <div style={errorBox}>{serverError}</div>}
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label htmlFor="term" style={labelStyle}>Term</label>
        <select id="term" style={inputStyle} {...register('term', { required: 'Term is required' })}>
          <option value="">Select a term…</option>
          {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {errors.term && <span style={fieldErr}>{errors.term.message}</span>}

        <label htmlFor="applicationNote" style={labelStyle}>Note (optional)</label>
        <textarea id="applicationNote" rows={4} style={{ ...inputStyle, resize: 'vertical' }} {...register('applicationNote')} />

        <button type="submit" disabled={isSubmitting} style={primaryBtn}>
          {isSubmitting ? 'Creating…' : 'Create Draft'}
        </button>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#374151' };
const inputStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14, fontFamily: 'inherit' };
const fieldErr: React.CSSProperties = { fontSize: 12, color: '#ef4444' };
const errorBox: React.CSSProperties = { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4, padding: '8px 12px', fontSize: 13, color: '#b91c1c', marginBottom: 12 };
const primaryBtn: React.CSSProperties = { marginTop: 8, padding: '10px', background: '#1d3c6e', color: '#fff', border: 'none', borderRadius: 4, fontSize: 15, cursor: 'pointer', fontWeight: 600 };
