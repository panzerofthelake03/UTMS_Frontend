import { useEffect, useState } from 'react';
import { adminApi, type AdminApplication } from '../../shared/api/adminApi';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import Spinner from '../../shared/components/Spinner';
import EmptyState from '../../shared/components/EmptyState';

interface RejectState {
  id: number | null;
  note: string;
  submitting: boolean;
  error: string | null;
}

export default function OidbSecondaryReviewPage() {
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [reject, setReject] = useState<RejectState>({ id: null, note: '', submitting: false, error: null });

  useEffect(() => {
    adminApi.oidbSecondaryReviewList().then((r) => setApps(r.data.data)).finally(() => setLoading(false));
  }, []);

  function openReject(id: number) {
    setReject({ id, note: '', submitting: false, error: null });
  }

  function closeReject() {
    setReject({ id: null, note: '', submitting: false, error: null });
  }

  async function submitReject() {
    if (!reject.id) return;
    if (!reject.note.trim()) {
      setReject((r) => ({ ...r, error: 'Rejection reason is required.' }));
      return;
    }
    setReject((r) => ({ ...r, submitting: true, error: null }));
    try {
      const res = await adminApi.oidbSecondaryReject(reject.id, reject.note);
      setApps((prev) => prev.filter((a) => a.id !== reject.id));
      setApps((prev) => [...prev.filter((a) => a.id !== res.data.data.id)]);
      closeReject();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setReject((r) => ({
        ...r,
        submitting: false,
        error: err.response?.data?.error?.message ?? 'Rejection failed.',
      }));
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Secondary Review</h2>
      <p className="text-sm text-gray-500 mb-5">
        Applications accepted by YGK and awaiting dean approval.
        ÖİDB may reject an application at this stage with a stated reason.
      </p>

      {apps.length === 0 ? (
        <EmptyState message="No applications pending secondary review." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {['Student', 'Term', 'GPA', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800">{a.studentFirstName} {a.studentLastName}</div>
                    <div className="text-xs text-gray-400">{a.studentEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.term}</td>
                  <td className="px-4 py-3 text-gray-600">{a.gpa ?? '—'}</td>
                  <td className="px-4 py-3"><ApplicationStatusBadge status={a.status} /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openReject(a.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {apps.length} application{apps.length !== 1 ? 's' : ''} pending secondary review
          </div>
        </div>
      )}

      {/* Reject modal */}
      {reject.id !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-gray-900 mb-1">Reject Application</h3>
            <p className="text-sm text-gray-500 mb-4">
              Application #{reject.id} — provide a reason if you disagree with the YGK decision.
            </p>

            {reject.error && (
              <div className="mb-3 px-3 py-2 text-sm bg-red-50 border border-red-200 rounded-lg text-red-700">
                {reject.error}
              </div>
            )}

            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reject.note}
              onChange={(e) => setReject((r) => ({ ...r, note: e.target.value }))}
              placeholder="Enter rejection reason in detail…"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 resize-none mb-4"
              style={{ fontFamily: 'inherit' }}
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={closeReject}
                className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => void submitReject()}
                disabled={reject.submitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
              >
                {reject.submitting ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
