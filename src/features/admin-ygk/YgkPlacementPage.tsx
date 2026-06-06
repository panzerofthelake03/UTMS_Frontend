import { useEffect, useState } from 'react';
import { adminApi, type PlacementEntry } from '../../shared/api/adminApi';
import Spinner from '../../shared/components/Spinner';
import EmptyState from '../../shared/components/EmptyState';

const PRIMARY = '#8b1a1a';

export default function YgkPlacementPage() {
  const [entries, setEntries] = useState<PlacementEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeMsg, setFinalizeMsg] = useState<string | null>(null);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.ygkPlacement().then((r) => setEntries(r.data.data)).finally(() => setLoading(false));
  }, []);

  async function handleFinalize() {
    if (!confirm('The list will be sent to ÖİDB for secondary review. Do you confirm?')) return;
    setFinalizing(true);
    setFinalizeMsg(null);
    setFinalizeError(null);
    try {
      const res = await adminApi.ygkFinalizeList();
      setFinalizeMsg(`List successfully sent to ÖİDB for secondary review. ${res.data.data} application(s) forwarded.`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setFinalizeError(err.response?.data?.error?.message ?? 'Failed to send list.');
    } finally {
      setFinalizing(false);
    }
  }

  if (loading) return <Spinner />;

  const pendingCount = entries.filter((e) => e.status === 'PENDING_DEAN_APPROVAL').length;

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Placement List</h2>
          <p className="text-sm text-gray-500">
            Applications evaluated by YGK — ranked by composite score.
          </p>
        </div>
        {pendingCount > 0 && (
          <button
            onClick={() => void handleFinalize()}
            disabled={finalizing}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-opacity disabled:opacity-50"
            style={{ background: PRIMARY }}
          >
            {finalizing ? 'Sending…' : `Send List to ÖİDB (${pendingCount})`}
          </button>
        )}
      </div>

      {finalizeMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          ✓ {finalizeMsg}
        </div>
      )}
      {finalizeError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {finalizeError}
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyState message="No evaluated applications yet." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {['Rank', 'Student', 'Student No', 'Department', 'Term', 'Composite Score', 'Status'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.applicationId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white"
                      style={{ background: e.rank <= 3 ? PRIMARY : '#6b7280' }}
                    >
                      {e.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{e.studentName}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{e.studentNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{e.department}</td>
                  <td className="px-4 py-3 text-gray-600">{e.term}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-base" style={{ color: PRIMARY }}>
                      {e.compositeScore != null ? Number(e.compositeScore).toFixed(2) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={e.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            Total {entries.length} application{entries.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    PENDING_DEAN_APPROVAL: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending Dean Approval' },
    ACCEPTED:              { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Accepted'              },
    REJECTED:              { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Rejected'              },
  };
  const c = cfg[status] ?? { bg: 'bg-gray-50', text: 'text-gray-600', label: status };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
