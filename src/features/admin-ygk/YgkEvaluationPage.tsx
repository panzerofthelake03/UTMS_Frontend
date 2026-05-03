import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { adminApi, type AdminApplication, type EvaluationResponse } from '../../shared/api/adminApi';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import Spinner from '../../shared/components/Spinner';

interface FormValues {
  gpaScore: number;
  languageScore: number;
  manualAdjustment: number;
  adjustmentReason: string;
  decision: string;
  evaluatorNote: string;
}

export default function YgkEvaluationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<AdminApplication | null>(null);
  const [existing, setExisting] = useState<EvaluationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ defaultValues: { manualAdjustment: 0 } });

  const appId = Number(id);

  useEffect(() => {
    Promise.all([
      adminApi.ygkList(),
      adminApi.ygkGetEvaluation(appId).catch(() => null),
    ]).then(([listRes, evalRes]) => {
      setApp(listRes.data.data.find((a) => a.id === appId) ?? null);
      setExisting(evalRes?.data.data ?? null);
    }).finally(() => setLoading(false));
  }, [appId]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await adminApi.ygkEvaluate(appId, values);
      navigate('/admin/ygk/applications');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setServerError(err.response?.data?.error?.message ?? 'Evaluation failed.');
    }
  }

  if (loading) return <Spinner />;
  if (!app) return <div>Application not found.</div>;

  return (
    <div style={{ maxWidth: 600 }}>
      <button onClick={() => navigate('/admin/ygk/applications')} style={backBtn}>← Back</button>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Application #{app.id}</h2>
        <ApplicationStatusBadge status={app.status} />
      </div>
      <dl style={dl}>
        <dt>Student</dt><dd>{app.studentFirstName} {app.studentLastName}</dd>
        <dt>GPA</dt><dd>{app.gpa ?? '—'}</dd>
        <dt>Term</dt><dd>{app.term}</dd>
      </dl>

      {existing && (
        <div style={{ margin: '16px 0', padding: '12px 16px', background: '#eff6ff', borderRadius: 8, fontSize: 14 }}>
          <strong>Existing evaluation:</strong> Composite score {existing.compositeScore} — {existing.decision}
        </div>
      )}

      {app.status === 'UNDER_YGK_REVIEW' && (
        <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>Submit Evaluation</h3>
          {serverError && <div style={errBox}>{serverError}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle} htmlFor="gpaScore">GPA Score (0–100)</label>
              <input id="gpaScore" type="number" step="0.01" style={inputStyle}
                {...register('gpaScore', { required: 'Required', min: 0, max: 100, valueAsNumber: true })} />
              {errors.gpaScore && <span style={fieldErr}>{errors.gpaScore.message}</span>}
            </div>
            <div>
              <label style={labelStyle} htmlFor="languageScore">Language Score (0–100)</label>
              <input id="languageScore" type="number" step="0.01" style={inputStyle}
                {...register('languageScore', { required: 'Required', min: 0, max: 100, valueAsNumber: true })} />
              {errors.languageScore && <span style={fieldErr}>{errors.languageScore.message}</span>}
            </div>
          </div>

          <label style={labelStyle} htmlFor="manualAdjustment">Manual Adjustment (−5 to +5)</label>
          <input id="manualAdjustment" type="number" step="0.5" style={inputStyle}
            {...register('manualAdjustment', { min: -5, max: 5, valueAsNumber: true })} />

          <label style={labelStyle} htmlFor="adjustmentReason">Adjustment Reason</label>
          <input id="adjustmentReason" style={inputStyle} {...register('adjustmentReason')} />

          <label style={labelStyle} htmlFor="decision">Decision</label>
          <select id="decision" style={inputStyle} {...register('decision', { required: 'Required' })}>
            <option value="">Select…</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          {errors.decision && <span style={fieldErr}>{errors.decision.message}</span>}

          <label style={labelStyle} htmlFor="evaluatorNote">Evaluator Note</label>
          <textarea id="evaluatorNote" rows={3} style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
            {...register('evaluatorNote')} />

          <button type="submit" disabled={isSubmitting} style={primaryBtn}>
            {isSubmitting ? 'Submitting…' : 'Submit Evaluation'}
          </button>
        </form>
      )}
    </div>
  );
}

const backBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#1d3c6e', cursor: 'pointer', fontSize: 13, padding: '0 0 12px', fontWeight: 600 };
const dl: React.CSSProperties = { display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 12px', fontSize: 14 };
const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600 };
const inputStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14, width: '100%', boxSizing: 'border-box' };
const fieldErr: React.CSSProperties = { fontSize: 12, color: '#ef4444' };
const primaryBtn: React.CSSProperties = { padding: '9px 20px', background: '#1d3c6e', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' };
const errBox: React.CSSProperties = { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4, padding: '7px 10px', fontSize: 13, color: '#b91c1c' };
