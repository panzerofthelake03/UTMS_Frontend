import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type AdminApplication } from '../../shared/api/adminApi';
import Spinner from '../../shared/components/Spinner';
import EmptyState from '../../shared/components/EmptyState';

const DECISIONS = ['', 'PASS', 'FAIL', 'DOCUMENT_REQUIRED'];
const DECISION_LABELS: Record<string, string> = {
  '': 'Select decision...', PASS: 'Pass', FAIL: 'Fail', DOCUMENT_REQUIRED: 'Document Required',
};
const DECISION_COLORS: Record<string, string> = {
  PASS: 'text-green-600', FAIL: 'text-red-600', DOCUMENT_REQUIRED: 'text-amber-600',
};

type DecisionMap = Record<number, string>;

export default function YdyoQueuePage() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [decisions, setDecisions] = useState<DecisionMap>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.ydyoList().then((r) => setApps(r.data.data)).finally(() => setLoading(false));
  }, []);

  const allDecided = apps.length > 0 && apps.every((a) => decisions[a.id]);

  async function handleDecisionChange(appId: number, decision: string) {
    setDecisions((prev) => ({ ...prev, [appId]: decision }));
    if (!decision) return;
    setSaving((prev) => ({ ...prev, [appId]: true }));
    try { await adminApi.ydyoSetDecision(appId, decision); }
    catch { setError(`Failed to save decision for application #${appId}`); }
    finally { setSaving((prev) => ({ ...prev, [appId]: false })); }
  }

  async function handleSendToOidb() {
    setSending(true); setError(null); setSendResult(null);
    try {
      const res = await adminApi.ydyoSendToOidb();
      setSendResult(`${res.data.data.processed} application(s) forwarded to ÖİDB.`);
      const updated = await adminApi.ydyoList();
      setApps(updated.data.data); setDecisions({});
    } catch { setError('Failed to send results to ÖİDB. Please try again.'); }
    finally { setSending(false); }
  }

  if (loading) return <div className="p-8"><Spinner /></div>;

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-lg font-bold text-gray-900">English Proficiency Validation – YDYO</h2>
          <p className="text-xs text-gray-400 mt-0.5">2025–2026 Undergraduate Transfer Applications</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition">
            ⚙ Filter
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition">
            ↑ Export
          </button>
        </div>
      </div>

      {/* Deadline banner */}
      <div className="my-4 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-700">
        ℹ Validation Deadline: 3 days remaining. New submissions cannot be made after the deadline.
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}
      {sendResult && <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">{sendResult}</div>}

      {apps.length === 0 ? (
        <EmptyState message="No applications awaiting English proficiency review." />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  {['Student Details', 'Document Uploaded', 'Check Proficiency', 'Info', 'Decision'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {apps.map((a) => {
                  const dec = decisions[a.id] ?? '';
                  const initials = `${a.studentFirstName?.[0] ?? ''}${a.studentLastName?.[0] ?? ''}`;
                  return (
                    <tr key={a.id} className="hover:bg-gray-50/50 transition">
                      {/* Student */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#8b1a1a] text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{a.studentFirstName} {a.studentLastName}</p>
                            <p className="text-xs text-gray-400">{a.studentNumber}</p>
                            <p className="text-xs text-gray-300">{a.department}</p>
                          </div>
                        </div>
                      </td>
                      {/* Document */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Yes
                        </span>
                      </td>
                      {/* Check Proficiency */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => navigate(`/admin/ydyo/applications/${a.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1d3c6e] hover:bg-[#16305a] text-white text-xs font-semibold rounded-lg transition"
                        >
                          📄 Check Proficiency
                        </button>
                      </td>
                      {/* Info */}
                      <td className="px-5 py-4">
                        <span title={`GPA: ${a.gpa ?? '—'} | ${a.studentEmail}`}
                          className="text-gray-300 hover:text-gray-500 cursor-help text-base">ℹ</span>
                      </td>
                      {/* Decision */}
                      <td className="px-5 py-4">
                        {saving[a.id] ? (
                          <span className="text-xs text-gray-400">Saving…</span>
                        ) : (
                          <select
                            value={dec}
                            onChange={(e) => void handleDecisionChange(a.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer focus:outline-none transition min-w-[150px] ${
                              dec ? `${DECISION_COLORS[dec]} border-current bg-white` : 'border-gray-200 text-gray-500 bg-gray-50'
                            }`}
                          >
                            {DECISIONS.map((d) => (
                              <option key={d} value={d}>{DECISION_LABELS[d]}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end px-5 py-4 border-t border-gray-100">
            <button
              onClick={() => void handleSendToOidb()}
              disabled={!allDecided || sending}
              className="px-6 py-2.5 bg-[#8b1a1a] hover:bg-[#6b1414] text-white text-sm font-semibold rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
              title={!allDecided ? 'All students must have a decision before sending' : ''}
            >
              {sending ? 'Sending…' : 'Send to ÖİDB'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
