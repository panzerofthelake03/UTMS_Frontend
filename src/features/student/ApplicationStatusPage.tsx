import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationApi, type Application, type TimelineEntry } from '../../shared/api/applicationApi';
import Spinner from '../../shared/components/Spinner';

const STAGES = [
  { key: 'DOC_VERIFY',   label: 'Document Verification',  statuses: ['SUBMITTED', 'UNDER_OIDB_REVIEW'] },
  { key: 'LANG_REVIEW',  label: 'Language Review (YDYO)', statuses: ['UNDER_YDYO_REVIEW', 'WAITING_EXAM_RESULT'] },
  { key: 'BOARD_REVIEW', label: 'Board Review (YGK)',      statuses: ['UNDER_YGK_REVIEW'] },
  { key: 'DEAN',         label: "Dean's Approval",        statuses: ['PENDING_DEAN_APPROVAL'] },
  { key: 'FINALIZED',    label: 'Finalized',               statuses: ['ACCEPTED', 'REJECTED'] },
];

const STATUS_MESSAGES: Record<string, string> = {
  SUBMITTED:             'Pending Document Verification (ÖİDB)',
  UNDER_OIDB_REVIEW:     "Under Review by Registrar's Office (ÖİDB)",
  UNDER_YDYO_REVIEW:     'Under Review by School of Foreign Languages',
  WAITING_EXAM_RESULT:   'Waiting for Language Exam Result',
  UNDER_YGK_REVIEW:      'Under Review by Faculty Administrative Board',
  PENDING_DEAN_APPROVAL: "Pending Dean's Approval",
  ACCEPTED:              'Finalized – Results Announced',
  REJECTED:              'Finalized – Results Announced',
  DRAFT:                 'Draft – Not Yet Submitted',
};

const ESTIMATED_TIMES: Record<string, string> = {
  SUBMITTED: '3–5 Business Days', UNDER_OIDB_REVIEW: '2–3 Business Days',
  UNDER_YDYO_REVIEW: '5–7 Business Days', WAITING_EXAM_RESULT: 'Pending Exam',
  UNDER_YGK_REVIEW: '7–10 Business Days', PENDING_DEAN_APPROVAL: '2–3 Business Days',
  ACCEPTED: 'Completed', REJECTED: 'Completed',
};

function getActiveStageIndex(status: string) {
  for (let i = 0; i < STAGES.length; i++) {
    if (STAGES[i].statuses.includes(status)) return i;
  }
  return -1;
}

export default function ApplicationStatusPage() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applicationApi.list().then((res) => {
      const data = res.data.data;
      setApps(data);
      const active = data.find((a) => !['DRAFT', 'REJECTED', 'ACCEPTED'].includes(a.status)) ?? data[0] ?? null;
      setSelected(active);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    applicationApi.timeline(selected.id).then((res) => setTimeline(res.data.data));
  }, [selected?.id]);

  if (loading) return <div className="p-8"><Spinner /></div>;

  if (apps.length === 0) {
    return (
      <div className="p-6 md:p-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Application Status Tracking</h1>
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-md">
          <p className="text-gray-500 mb-4">You have no active applications.</p>
          <button onClick={() => navigate('/student/applications/new')}
            className="px-5 py-2.5 bg-[#8b1a1a] text-white rounded-lg text-sm font-semibold hover:bg-[#6b1414] transition">
            Apply Now
          </button>
        </div>
      </div>
    );
  }

  const activeIdx = selected ? getActiveStageIndex(selected.status) : -1;
  const isFinalized = selected?.status === 'ACCEPTED' || selected?.status === 'REJECTED';
  const statusMsg = selected ? (STATUS_MESSAGES[selected.status] ?? selected.status) : '';

  return (
    <div className="p-6 md:p-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Application Status Tracking</h1>
      <p className="text-sm text-gray-500 mb-6">Monitor your transfer application progress in real-time</p>

      {apps.length > 1 && (
        <select
          className="mb-5 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white max-w-sm w-full"
          value={selected?.id}
          onChange={(e) => setSelected(apps.find((a) => a.id === Number(e.target.value)) ?? null)}
        >
          {apps.map((a) => (
            <option key={a.id} value={a.id}>Application #{a.id} — {a.term} ({a.status})</option>
          ))}
        </select>
      )}

      {selected && (
        <div className="space-y-5">
          {/* Status card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 text-base mb-6">Current Application Status</h3>

            {/* Pipeline */}
            <div className="flex items-start justify-between relative mb-6 overflow-x-auto pb-2">
              {STAGES.map((stage, idx) => {
                const isCompleted = idx < activeIdx;
                const isCurrent = idx === activeIdx;
                return (
                  <div key={stage.key} className="flex flex-col items-center flex-1 relative min-w-[80px]">
                    {idx > 0 && (
                      <div className={`absolute top-5 right-1/2 w-full h-0.5 ${isCompleted || isCurrent ? 'bg-[#8b1a1a]' : 'bg-gray-200'}`} />
                    )}
                    <div className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition ${
                      isCompleted ? 'bg-[#8b1a1a] border-[#8b1a1a] text-white'
                        : isCurrent ? 'bg-white border-[#8b1a1a] text-[#8b1a1a]'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}>
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <div className="mt-2 text-center">
                      <p className={`text-[10px] font-semibold leading-tight ${isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                        {stage.label}
                      </p>
                      {isCompleted && <p className="text-[9px] text-green-600 mt-0.5">✓ Complete</p>}
                      {isCurrent && <p className="text-[9px] text-[#8b1a1a] font-bold mt-0.5">● In Progress</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status message */}
            <div className="bg-gray-50 rounded-xl p-4 mb-3">
              <p className="text-sm font-semibold text-gray-800">● {statusMsg}</p>
              <p className="text-xs text-gray-400 mt-1">
                Last Updated: {new Date(selected.updatedAt).toLocaleString()}
              </p>
            </div>

            {/* Admin note */}
            {timeline.length > 0 && timeline[timeline.length - 1].note && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex gap-3">
                <span className="text-amber-500 shrink-0">ℹ</span>
                <div>
                  <p className="text-xs font-semibold text-amber-800 mb-1">Administrative Note</p>
                  <p className="text-xs text-amber-700">{timeline[timeline.length - 1].note}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              {isFinalized && (
                <button onClick={() => navigate('/student/results')}
                  className="px-4 py-2 bg-[#8b1a1a] text-white rounded-lg text-sm font-semibold hover:bg-[#6b1414] transition">
                  View Results
                </button>
              )}
              <button onClick={() => navigate('/student/contact')}
                className="flex items-center gap-2 px-4 py-2 border border-[#8b1a1a] text-[#8b1a1a] rounded-lg text-sm font-semibold hover:bg-[#8b1a1a]/5 transition">
                💬 Contact Support
              </button>
            </div>
          </div>

          {/* Application History */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 text-base mb-4">Application History</h3>
            {timeline.length === 0 ? (
              <p className="text-sm text-gray-400">No history yet.</p>
            ) : (
              <div className="space-y-4">
                {[...timeline].reverse().map((entry) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5">✓</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{entry.toStatus.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(entry.changedAt).toLocaleString()}</p>
                      {entry.note && <p className="text-xs text-gray-600 mt-1">{entry.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '🕐', label: 'Estimated Time', value: ESTIMATED_TIMES[selected.status] ?? '—' },
              { icon: '📄', label: 'Documents Status', value: 'All Verified', green: true },
              { icon: '👥', label: 'Current Stage', value: STAGES[activeIdx]?.label ?? '—' },
            ].map((c) => (
              <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-5 text-center shadow-sm">
                <div className="text-2xl mb-2">{c.icon}</div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{c.label}</p>
                <p className={`text-sm font-bold ${c.green ? 'text-green-600' : 'text-gray-900'}`}>{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
