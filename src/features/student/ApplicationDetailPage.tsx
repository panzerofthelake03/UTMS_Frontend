import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { applicationApi, type Application, type Document, type TimelineEntry } from '../../shared/api/applicationApi';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import Spinner from '../../shared/components/Spinner';
import Timeline from './components/Timeline';
import DocumentUpload from './components/DocumentUpload';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const appId = Number(id);

  useEffect(() => {
    Promise.all([
      applicationApi.get(appId),
      applicationApi.timeline(appId),
      applicationApi.listDocuments(appId),
    ]).then(([a, t, d]) => {
      setApp(a.data.data);
      setTimeline(t.data.data);
      setDocs(d.data.data);
    }).finally(() => setLoading(false));
  }, [appId]);

  async function handleSubmit() {
    if (!app) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await applicationApi.submit(appId);
      setApp(res.data.data);
      const t = await applicationApi.timeline(appId);
      setTimeline(t.data.data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setSubmitError(err.response?.data?.error?.message ?? 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner />;
  if (!app) return <div>Application not found.</div>;

  const canSubmit = app.status === 'DRAFT';

  return (
    <div style={{ maxWidth: 760 }}>
      <button onClick={() => navigate('/student/applications')} style={backBtn}>← Back</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Application #{app.id}</h2>
        <ApplicationStatusBadge status={app.status} />
      </div>

      <section style={section}>
        <h3 style={sectionTitle}>Details</h3>
        <dl style={dl}>
          <dt>Term</dt><dd>{app.term}</dd>
          <dt>Note</dt><dd>{app.applicationNote ?? '—'}</dd>
          <dt>Submitted</dt><dd>{app.submittedAt ? new Date(app.submittedAt).toLocaleString() : '—'}</dd>
          <dt>Created</dt><dd>{new Date(app.createdAt).toLocaleString()}</dd>
        </dl>
        {canSubmit && (
          <div style={{ marginTop: 16 }}>
            {submitError && <div style={errBox}>{submitError}</div>}
            <button onClick={handleSubmit} disabled={submitting} style={primaryBtn}>
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        )}
      </section>

      <section style={section}>
        <h3 style={sectionTitle}>Documents</h3>
        {canSubmit && (
          <DocumentUpload
            applicationId={appId}
            onUploaded={(doc) => setDocs((prev) => [...prev, doc])}
          />
        )}
        {docs.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 12 }}>No documents uploaded.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 12 }}>
            <thead>
              <tr>
                {['Type', 'File', 'Scan Status', 'Uploaded'].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={td}>{d.documentType}</td>
                  <td style={td}>{d.originalFileName}</td>
                  <td style={td}><ScanBadge status={d.scanStatus} /></td>
                  <td style={td}>{new Date(d.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={section}>
        <h3 style={sectionTitle}>Timeline</h3>
        <Timeline entries={timeline} />
      </section>
    </div>
  );
}

function ScanBadge({ status }: { status: string }) {
  const colors: Record<string, string> = { CLEAN: '#10b981', INFECTED: '#ef4444', PENDING: '#f59e0b' };
  return (
    <span style={{ color: colors[status] ?? '#6b7280', fontWeight: 600, fontSize: 12 }}>{status}</span>
  );
}

const section: React.CSSProperties = { marginBottom: 28, padding: '16px 20px', border: '1px solid #e5e7eb', borderRadius: 8 };
const sectionTitle: React.CSSProperties = { margin: '0 0 12px', fontSize: 15, color: '#1d3c6e' };
const dl: React.CSSProperties = { display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 12px', fontSize: 14 };
const th: React.CSSProperties = { textAlign: 'left', padding: '6px 10px', background: '#f9fafb', fontWeight: 600, fontSize: 11, color: '#6b7280', textTransform: 'uppercase' };
const td: React.CSSProperties = { padding: '8px 10px' };
const primaryBtn: React.CSSProperties = { padding: '9px 20px', background: '#1d3c6e', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer' };
const errBox: React.CSSProperties = { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4, padding: '7px 10px', fontSize: 13, color: '#b91c1c', marginBottom: 8 };
const backBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#1d3c6e', cursor: 'pointer', fontSize: 13, padding: '0 0 12px', fontWeight: 600 };
