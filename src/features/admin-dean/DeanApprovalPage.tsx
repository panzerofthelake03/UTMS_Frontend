import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi, type AdminApplication } from '../../shared/api/adminApi';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import Spinner from '../../shared/components/Spinner';

const PRIMARY = '#8b1a1a';

export default function DeanApprovalPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const appId = Number(id);
  const [app, setApp] = useState<AdminApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    adminApi.deanList()
      .then((r) => setApp(r.data.data.find((a) => a.id === appId) ?? null))
      .finally(() => setLoading(false));
  }, [appId]);

  async function handleDecision(action: 'approve' | 'reject') {
    setError(null); setSubmitting(action);
    try {
      const res = action === 'approve'
        ? await adminApi.deanApprove(appId, note || undefined)
        : await adminApi.deanReject(appId, note || undefined);
      setApp(res.data.data);
      setDone(action === 'approve'
        ? 'Application approved. The student has been notified.'
        : 'Application rejected.');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setError(err.response?.data?.error?.message ?? 'Action failed.');
    } finally { setSubmitting(null); }
  }

  if (loading) return <div className="p-8"><Spinner /></div>;
  if (!app) return <div className="p-8 text-gray-500">Application not found.</div>;

  const isPending = app.status === 'PENDING_DEAN_APPROVAL';

  return (
    <div className="p-6 md:p-10 max-w-2xl">
      {/* Back */}
      <button
        onClick={() => navigate('/admin/dean/applications')}
        className="flex items-center gap-1 text-sm font-semibold mb-5 hover:opacity-75 transition-opacity"
        style={{ color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Queue
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900 m-0">Application #{app.id}</h1>
        <ApplicationStatusBadge status={app.status} />
      </div>

      {/* Student info */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Student Information</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <InfoField label="Full Name" value={`${app.studentFirstName} ${app.studentLastName}`} />
          <InfoField label="Email" value={app.studentEmail} />
          <InfoField label="Student No" value={app.studentNumber ?? '—'} />
          <InfoField label="Department" value={app.department ?? '—'} />
          <InfoField label="Faculty" value={app.faculty ?? '—'} />
          <InfoField label="Term" value={app.term} />
          <InfoField label="GPA" value={app.gpa != null ? String(app.gpa) : '—'} />
        </div>
      </section>

      {/* Decision */}
      {isPending && !done && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 m-0">Make Decision</h2>
          </div>
          <div className="p-5 flex flex-col gap-4">
            {error && (
              <div className="px-3 py-2 text-sm rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Note <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none resize-none"
                style={{ fontFamily: 'inherit' }}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Decision reason…"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => void handleDecision('approve')}
                disabled={submitting !== null}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-opacity bg-green-600 hover:bg-green-700"
              >
                {submitting === 'approve' ? 'Processing…' : '✓ Approve'}
              </button>
              <button
                onClick={() => void handleDecision('reject')}
                disabled={submitting !== null}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-opacity bg-red-600 hover:bg-red-700"
              >
                {submitting === 'reject' ? 'Processing…' : '✕ Reject'}
              </button>
            </div>
          </div>
        </section>
      )}

      {done && (
        <div className="mt-4 px-4 py-3 text-sm rounded-xl bg-green-50 border border-green-200 text-green-800 font-medium">
          ✓ {done}
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-800">{value}</div>
    </div>
  );
}
