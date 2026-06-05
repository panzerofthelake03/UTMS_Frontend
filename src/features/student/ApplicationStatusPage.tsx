import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationApi, type Application, type TimelineEntry } from '../../shared/api/applicationApi';
import Spinner from '../../shared/components/Spinner';

const PRIMARY = '#8b1a1a';

// UC 1.8: visual stage pipeline
const STAGES = [
  { key: 'DOCUMENT_VERIFICATION', label: 'Document Verification', statuses: ['SUBMITTED', 'UNDER_OIDB_REVIEW'] },
  { key: 'LANGUAGE_REVIEW', label: 'Language Review (YDYO)', statuses: ['UNDER_YDYO_REVIEW', 'WAITING_EXAM_RESULT'] },
  { key: 'BOARD_REVIEW', label: 'Board Review (YGK)', statuses: ['UNDER_YGK_REVIEW'] },
  { key: 'DEANS_APPROVAL', label: "Dean's Approval", statuses: ['PENDING_DEAN_APPROVAL'] },
  { key: 'FINALIZED', label: 'Finalized', statuses: ['ACCEPTED', 'REJECTED'] },
];

function getActiveStageIndex(status: string): number {
  for (let i = 0; i < STAGES.length; i++) {
    if (STAGES[i].statuses.includes(status)) return i;
  }
  return -1;
}

const STATUS_MESSAGES: Record<string, string> = {
  SUBMITTED: 'Pending Document Verification (ÖİDB)',
  UNDER_OIDB_REVIEW: 'Under Review by Registrar\'s Office (ÖİDB)',
  UNDER_YDYO_REVIEW: 'Under Review by School of Foreign Languages',
  WAITING_EXAM_RESULT: 'Waiting for Language Exam Result',
  UNDER_YGK_REVIEW: 'Under Review by Faculty Administrative Board',
  PENDING_DEAN_APPROVAL: "Pending Dean's Approval",
  ACCEPTED: 'Finalized – Results Announced',
  REJECTED: 'Finalized – Results Announced',
  DRAFT: 'Draft – Not Yet Submitted',
};

const ESTIMATED_TIMES: Record<string, string> = {
  SUBMITTED: '3–5 Business Days',
  UNDER_OIDB_REVIEW: '2–3 Business Days',
  UNDER_YDYO_REVIEW: '5–7 Business Days',
  WAITING_EXAM_RESULT: 'Pending Exam',
  UNDER_YGK_REVIEW: '7–10 Business Days',
  PENDING_DEAN_APPROVAL: '2–3 Business Days',
  ACCEPTED: 'Completed',
  REJECTED: 'Completed',
};

export default function ApplicationStatusPage() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applicationApi.list()
      .then((res) => {
        const data = res.data.data;
        setApps(data);
        const active = data.find((a) => !['DRAFT', 'REJECTED', 'ACCEPTED'].includes(a.status))
          ?? data[0] ?? null;
        setSelected(active);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    applicationApi.timeline(selected.id)
      .then((res) => setTimeline(res.data.data));
  }, [selected?.id]);

  if (loading) return <Spinner />;

  if (apps.length === 0) {
    return (
      <div style={{ maxWidth: 600 }}>
        <h2 style={s.pageTitle}>Application Status Tracking</h2>
        <div style={s.emptyCard}>
          <p style={{ color: '#6b7280', margin: '0 0 16px' }}>You have no active applications.</p>
          <button onClick={() => navigate('/student/applications/new')} style={s.btn}>
            Apply Now
          </button>
        </div>
      </div>
    );
  }

  const activeIdx = selected ? getActiveStageIndex(selected.status) : -1;
  const isFinalized = selected?.status === 'ACCEPTED' || selected?.status === 'REJECTED';
  const statusMessage = selected ? (STATUS_MESSAGES[selected.status] ?? selected.status) : '';

  return (
    <div style={{ maxWidth: 860 }}>
      <h2 style={s.pageTitle}>Application Status Tracking</h2>
      <p style={s.pageSubtitle}>Monitor your transfer application progress in real-time</p>

      {apps.length > 1 && (
        <div style={{ marginBottom: 16 }}>
          <select
            style={{ ...s.selectInput, maxWidth: 300 }}
            value={selected?.id}
            onChange={(e) => {
              const a = apps.find((ap) => ap.id === Number(e.target.value)) ?? null;
              setSelected(a);
            }}
          >
            {apps.map((a) => (
              <option key={a.id} value={a.id}>Application #{a.id} — {a.term} ({a.status})</option>
            ))}
          </select>
        </div>
      )}

      {selected && (
        <>
          {/* Current Application Status */}
          <div style={s.card}>
            <h3 style={{ ...s.cardTitle, marginBottom: 24 }}>Current Application Status</h3>

            {/* Timeline pipeline */}
            <div style={s.pipelineWrapper}>
              {STAGES.map((stage, idx) => {
                const isCompleted = idx < activeIdx;
                const isCurrent = idx === activeIdx;
                const isPending = idx > activeIdx;
                return (
                  <div key={stage.key} style={s.stageItem}>
                    {/* Connector line */}
                    {idx > 0 && (
                      <div style={{
                        ...s.connector,
                        background: isCompleted || isCurrent ? PRIMARY : '#d1d5db',
                      }} />
                    )}
                    {/* Circle */}
                    <div style={{
                      ...s.circle,
                      background: isCompleted ? PRIMARY : isCurrent ? '#fff' : '#f3f4f6',
                      border: isCurrent ? `3px solid ${PRIMARY}` : isCompleted ? `2px solid ${PRIMARY}` : '2px solid #d1d5db',
                      color: isCompleted ? '#fff' : isCurrent ? PRIMARY : '#9ca3af',
                    }}>
                      {isCompleted ? '✓' : isCurrent ? '👥' : '○'}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 8, maxWidth: 100 }}>
                      <div style={{ fontSize: 11, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#111827' : isPending ? '#9ca3af' : '#374151' }}>
                        {stage.label}
                      </div>
                      {isCompleted && <div style={s.completedLabel}>✓ Complete</div>}
                      {isCurrent && <div style={s.inProgressLabel}>● In Progress</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status message */}
            <div style={s.statusMsg}>
              <strong>{statusMessage}</strong>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                Last Updated: {new Date(selected.updatedAt).toLocaleString()}
              </div>
            </div>

            {/* Admin note (latest timeline entry note) */}
            {timeline.length > 0 && timeline[timeline.length - 1].note && (
              <div style={s.adminNote}>
                <span style={{ fontSize: 13, color: '#d97706' }}>ℹ</span>
                <span style={{ fontSize: 13, color: '#92400e', marginLeft: 8 }}>
                  {timeline[timeline.length - 1].note}
                </span>
              </div>
            )}

            {/* UC 1.8 4a: Returned for correction */}
            {selected.status === 'DRAFT' && (
              <div style={{ marginTop: 16 }}>
                <button onClick={() => navigate(`/student/applications/${selected.id}`)} style={s.btn}>
                  Fix Application
                </button>
              </div>
            )}

            {isFinalized && (
              <div style={{ marginTop: 16 }}>
                <button onClick={() => navigate('/student/results')} style={s.btn}>
                  View Results
                </button>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <button onClick={() => navigate('/student/contact')} style={s.outlineBtn}>
                💬 Contact Support
              </button>
            </div>
          </div>

          {/* Application History */}
          <div style={s.card}>
            <h3 style={{ ...s.cardTitle, marginBottom: 16 }}>Application History</h3>
            {timeline.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: 14 }}>No history yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...timeline].reverse().map((entry) => (
                  <div key={entry.id} style={s.historyItem}>
                    <div style={s.historyDot} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                        {entry.toStatus.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                        {new Date(entry.changedAt).toLocaleString()}
                      </div>
                      {entry.note && (
                        <div style={{ fontSize: 13, color: '#374151', marginTop: 4 }}>{entry.note}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary cards */}
          <div style={s.summaryRow}>
            <SummaryCard icon="🕐" label="Estimated Time" value={ESTIMATED_TIMES[selected.status] ?? '—'} />
            <SummaryCard icon="📄" label="Documents Status" value="All Verified" />
            <SummaryCard icon="👥" label="Current Stage" value={STAGES[activeIdx]?.label ?? '—'} />
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={s.summaryCard}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginTop: 4 }}>{value}</div>
    </div>
  );
}

const s = {
  pageTitle: { fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px' } as React.CSSProperties,
  pageSubtitle: { fontSize: 13, color: '#6b7280', margin: '0 0 20px' } as React.CSSProperties,
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '20px 24px', marginBottom: 20 } as React.CSSProperties,
  cardTitle: { fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 } as React.CSSProperties,
  emptyCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '32px 24px', textAlign: 'center' as const },
  pipelineWrapper: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, position: 'relative' as const },
  stageItem: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', flex: 1, position: 'relative' as const },
  connector: { position: 'absolute' as const, top: 18, right: '50%', width: '100%', height: 3, zIndex: 0 },
  circle: { width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, zIndex: 1, position: 'relative' as const },
  completedLabel: { fontSize: 10, color: '#16a34a', marginTop: 2 } as React.CSSProperties,
  inProgressLabel: { fontSize: 10, color: PRIMARY, marginTop: 2, fontWeight: 700 } as React.CSSProperties,
  statusMsg: { background: '#f9fafb', borderRadius: 6, padding: '12px 16px', fontSize: 14, color: '#374151' } as React.CSSProperties,
  adminNote: { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '10px 14px', marginTop: 12, display: 'flex', alignItems: 'flex-start' } as React.CSSProperties,
  historyItem: { display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 12, borderBottom: '1px solid #f3f4f6' } as React.CSSProperties,
  historyDot: { width: 10, height: 10, borderRadius: '50%', background: '#16a34a', marginTop: 4, flexShrink: 0 } as React.CSSProperties,
  summaryRow: { display: 'flex', gap: 16, flexWrap: 'wrap' as const },
  summaryCard: { flex: '1 1 160px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px', textAlign: 'center' as const } as React.CSSProperties,
  btn: { padding: '9px 20px', background: PRIMARY, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14 } as React.CSSProperties,
  outlineBtn: { padding: '8px 18px', background: '#fff', color: PRIMARY, border: `1.5px solid ${PRIMARY}`, borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 } as React.CSSProperties,
  selectInput: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', width: '100%' } as React.CSSProperties,
};
