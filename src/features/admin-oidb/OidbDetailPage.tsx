import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi, type AdminApplication } from '../../shared/api/adminApi';
import { applicationApi, type Document } from '../../shared/api/applicationApi';
import { useForm } from 'react-hook-form';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import Spinner from '../../shared/components/Spinner';

interface FormValues { note: string }

export default function OidbDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<AdminApplication | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({ defaultValues: { note: 'Documents look complete, forwarding to YDYO' } });

  const appId = Number(id);

  useEffect(() => {
    Promise.all([adminApi.oidbList(), applicationApi.listDocuments(appId)])
      .then(([appsRes, docsRes]) => {
        setApp(appsRes.data.data.find((a) => a.id === appId) ?? null);
        setDocs(docsRes.data.data);
      })
      .finally(() => setLoading(false));
  }, [appId]);

  async function onForward(values: FormValues) {
    setServerError(null);
    try {
      if (app?.status === 'SUBMITTED') {
        await adminApi.oidbTakeReview(appId);
      }
      const res = await adminApi.oidbForwardYdyo(appId, values.note);
      setApp(res.data.data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setServerError(err.response?.data?.error?.message ?? 'Action failed.');
    }
  }

  async function handleDownload(doc: Document) {
    setServerError(null);
    try {
      const res = await applicationApi.downloadDocument(appId, doc.id);
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: doc.mimeType }));
      const link = window.document.createElement('a');
      link.href = blobUrl;
      link.download = doc.originalFilename;
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setServerError(err.response?.data?.error?.message ?? 'Document download failed.');
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
      <div style={{ marginTop: 18 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>Documents</h3>
        {docs.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: 14 }}>No documents uploaded.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Type', 'File', 'Scan Status', 'Uploaded', 'Actions'].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={td}>{d.documentType}</td>
                  <td style={td}>{d.originalFilename}</td>
                  <td style={td}><ScanBadge status={d.scanStatus} /></td>
                  <td style={td}>{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td style={td}>
                    <button onClick={() => void handleDownload(d)} style={docBtn}>View PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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

function ScanBadge({ status }: { status: string }) {
  const colors: Record<string, string> = { CLEAN: '#10b981', INFECTED: '#ef4444', PENDING: '#f59e0b' };
  return (
    <span style={{ color: colors[status] ?? '#6b7280', fontWeight: 600, fontSize: 12 }}>{status}</span>
  );
}

const backBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#1d3c6e', cursor: 'pointer', fontSize: 13, padding: '0 0 12px', fontWeight: 600 };
const dl: React.CSSProperties = { display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 12px', fontSize: 14 };
const th: React.CSSProperties = { textAlign: 'left', padding: '6px 10px', background: '#f9fafb', fontWeight: 600, fontSize: 11, color: '#6b7280', textTransform: 'uppercase' };
const td: React.CSSProperties = { padding: '8px 10px' };
const docBtn: React.CSSProperties = { padding: '5px 10px', background: '#1d3c6e', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 };
const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600 };
const inputStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 };
const primaryBtn: React.CSSProperties = { padding: '9px 20px', background: '#1d3c6e', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' };
const errBox: React.CSSProperties = { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4, padding: '7px 10px', fontSize: 13, color: '#b91c1c' };
