import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi, type AdminApplication } from '../../shared/api/adminApi';
import { useForm } from 'react-hook-form';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import Spinner from '../../shared/components/Spinner';

interface FormValues { note: string }

export default function OidbDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<AdminApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({ defaultValues: { note: 'Documents look complete, forwarding to YDYO' } });

  const appId = Number(id);

  useEffect(() => {
    adminApi.oidbList().then((r) => {
      setApp(r.data.data.find((a) => a.id === appId) ?? null);
    }).finally(() => setLoading(false));
  }, [appId]);

  async function onForward(values: FormValues) {
    setServerError(null);
    try {
      const res = await adminApi.oidbForwardYdyo(appId, values.note);
      setApp(res.data.data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setServerError(err.response?.data?.error?.message ?? 'Action failed.');
    }
  }

  if (loading) return <Spinner />;
  if (!app) return <div>Application not found.</div>;

  const canForward = ['SUBMITTED', 'UNDER_OIDB_REVIEW'].includes(app.status);

  return (
    <div style={{ maxWidth: 640 }}>
      <button onClick={() => navigate('/admin/oidb/applications')} style={backBtn}>← Back</button>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Application #{app.id}</h2>
        <ApplicationStatusBadge status={app.status} />
      </div>
      <dl style={dl}>
        <dt>Student</dt><dd>{app.studentFirstName} {app.studentLastName} ({app.studentEmail})</dd>
        <dt>Term</dt><dd>{app.term}</dd>
        <dt>Submitted</dt><dd>{app.submittedAt ? new Date(app.submittedAt).toLocaleString() : '—'}</dd>
      </dl>
      {canForward && (
        <form onSubmit={handleSubmit(onForward)} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>Forward to YDYO</h3>
          {serverError && <div style={errBox}>{serverError}</div>}
          <label htmlFor="note" style={labelStyle}>Note</label>
          <input id="note" style={inputStyle} {...register('note', { required: 'Note is required' })} />
          <button type="submit" disabled={isSubmitting} style={primaryBtn}>
            {isSubmitting ? 'Forwarding…' : 'Forward to YDYO'}
          </button>
        </form>
      )}
    </div>
  );
}

const backBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#1d3c6e', cursor: 'pointer', fontSize: 13, padding: '0 0 12px', fontWeight: 600 };
const dl: React.CSSProperties = { display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 12px', fontSize: 14 };
const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600 };
const inputStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 };
const primaryBtn: React.CSSProperties = { padding: '9px 20px', background: '#1d3c6e', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' };
const errBox: React.CSSProperties = { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4, padding: '7px 10px', fontSize: 13, color: '#b91c1c' };
