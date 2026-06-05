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
    setError(null);
    setSubmitting(action);
    try {
      const res = action === 'approve'
        ? await adminApi.deanApprove(appId, note || undefined)
        : await adminApi.deanReject(appId, note || undefined);
      setApp(res.data.data);
      setDone(action === 'approve' ? 'Başvuru onaylandı ve öğrenciye bildirim gönderildi.' : 'Başvuru reddedildi.');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setError(err.response?.data?.error?.message ?? 'İşlem başarısız.');
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) return <Spinner />;
  if (!app) return <div className="text-gray-500">Başvuru bulunamadı.</div>;

  const isPending = app.status === 'PENDING_DEAN_APPROVAL';

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate('/admin/dean/applications')}
        className="flex items-center gap-1 text-sm font-semibold mb-5 hover:opacity-75 transition-opacity"
        style={{ color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        ← Geri
      </button>

      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xl font-bold text-gray-900 m-0">Başvuru #{app.id}</h2>
        <ApplicationStatusBadge status={app.status} />
      </div>

      {/* Student info */}
      <section className="bg-white border border-gray-200 rounded-xl mb-4 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Öğrenci Bilgileri</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Field label="Ad Soyad" value={`${app.studentFirstName} ${app.studentLastName}`} />
          <Field label="E-posta" value={app.studentEmail} />
          <Field label="Öğrenci No" value={app.studentNumber} />
          <Field label="Bölüm" value={app.department} />
          <Field label="Fakülte" value={app.faculty} />
          <Field label="Dönem" value={app.term} />
          <Field label="GNO" value={app.gpa != null ? String(app.gpa) : '—'} />
        </div>
      </section>

      {/* Decision */}
      {isPending && !done && (
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Karar Ver</h3>
          {error && (
            <div className="mb-3 px-3 py-2 text-sm rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>
          )}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Not (opsiyonel)</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none resize-none"
              style={{ fontFamily: 'inherit' }}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Karar gerekçesi..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => void handleDecision('approve')}
              disabled={submitting !== null}
              className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-opacity"
              style={{ background: '#16a34a' }}
            >
              {submitting === 'approve' ? 'İşleniyor…' : '✓ Onayla'}
            </button>
            <button
              onClick={() => void handleDecision('reject')}
              disabled={submitting !== null}
              className="flex-1 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-opacity"
              style={{ background: '#dc2626' }}
            >
              {submitting === 'reject' ? 'İşleniyor…' : '✕ Reddet'}
            </button>
          </div>
        </section>
      )}

      {done && (
        <div className="mt-4 px-4 py-3 text-sm rounded-xl bg-green-50 border border-green-200 text-green-800 font-medium">
          {done}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-800">{value ?? '—'}</div>
    </div>
  );
}
