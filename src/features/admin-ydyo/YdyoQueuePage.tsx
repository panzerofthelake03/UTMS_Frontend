import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type AdminApplication } from '../../shared/api/adminApi';
import Spinner from '../../shared/components/Spinner';
import EmptyState from '../../shared/components/EmptyState';

const PRIMARY = '#8b1a1a';
const DECISIONS = ['', 'PASS', 'FAIL', 'DOCUMENT_REQUIRED'];
const DECISION_LABELS: Record<string, string> = {
  '': 'Select decision...',
  PASS: 'Pass',
  FAIL: 'Fail',
  DOCUMENT_REQUIRED: 'Document Required',
};
const DECISION_COLORS: Record<string, string> = { PASS: '#16a34a', FAIL: '#dc2626', DOCUMENT_REQUIRED: '#d97706' };

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
    adminApi.ydyoList()
      .then((r) => setApps(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const allDecided = apps.length > 0 && apps.every((a) => decisions[a.id]);

  async function handleDecisionChange(appId: number, decision: string) {
    setDecisions((prev) => ({ ...prev, [appId]: decision }));
    if (!decision) return;
    setSaving((prev) => ({ ...prev, [appId]: true }));
    try {
      await adminApi.ydyoSetDecision(appId, decision);
    } catch {
      setError(`Failed to save decision for application #${appId}`);
    } finally {
      setSaving((prev) => ({ ...prev, [appId]: false }));
    }
  }

  async function handleSendToOidb() {
    setSending(true);
    setError(null);
    setSendResult(null);
    try {
      const res = await adminApi.ydyoSendToOidb();
      const count = res.data.data.processed;
      setSendResult(`${count} application(s) successfully forwarded to ÖİDB.`);
      // Refresh list
      const updated = await adminApi.ydyoList();
      setApps(updated.data.data);
      setDecisions({});
    } catch {
      setError('Failed to send results to ÖİDB. Please try again.');
    } finally {
      setSending(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>English Proficiency Validation – YDYO</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>2025–2026 Undergraduate Transfer Applications</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={s.filterBtn}>⚙ Filter</button>
          <button style={s.filterBtn}>↑ Export</button>
        </div>
      </div>

      {/* Deadline banner */}
      <div style={s.deadlineBanner}>
        ℹ Validation Deadline: 3 days remaining. New submissions cannot be made after the deadline.
      </div>

      {error && <div style={s.errorBox}>{error}</div>}
      {sendResult && <div style={s.successBox}>{sendResult}</div>}

      {apps.length === 0 ? (
        <EmptyState message="No applications awaiting English proficiency review." />
      ) : (
        <>
          <table style={s.table}>
            <thead>
              <tr>
                {['Student Details', 'Document Uploaded', 'Check Proficiency', 'Info', 'Decision'].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => {
                const dec = decisions[a.id] ?? '';
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {/* Student details */}
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={s.avatar}>
                          {a.studentFirstName?.[0]}{a.studentLastName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{a.studentFirstName} {a.studentLastName}</div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{a.studentNumber}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{a.department}</div>
                        </div>
                      </div>
                    </td>
                    {/* Document uploaded */}
                    <td style={s.td}>
                      <span style={{ fontSize: 12, background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                        Yes
                      </span>
                    </td>
                    {/* Check proficiency button */}
                    <td style={s.td}>
                      <button
                        onClick={() => navigate(`/admin/ydyo/applications/${a.id}`)}
                        style={s.checkBtn}
                      >
                        Check Proficiency
                      </button>
                    </td>
                    {/* Info */}
                    <td style={s.td}>
                      <span
                        title={`GPA: ${a.gpa ?? '—'} | Email: ${a.studentEmail}`}
                        style={{ cursor: 'help', fontSize: 16, color: '#6b7280' }}
                      >ℹ</span>
                    </td>
                    {/* Decision dropdown */}
                    <td style={s.td}>
                      {saving[a.id] ? (
                        <span style={{ fontSize: 12, color: '#6b7280' }}>Saving…</span>
                      ) : (
                        <select
                          value={dec}
                          onChange={(e) => void handleDecisionChange(a.id, e.target.value)}
                          style={{
                            ...s.decisionSelect,
                            color: dec ? DECISION_COLORS[dec] : '#6b7280',
                            fontWeight: dec ? 700 : 400,
                          }}
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              onClick={() => void handleSendToOidb()}
              disabled={!allDecided || sending}
              style={{
                ...s.sendBtn,
                opacity: !allDecided || sending ? 0.5 : 1,
                cursor: !allDecided || sending ? 'not-allowed' : 'pointer',
              }}
              title={!allDecided ? 'All students must have a decision before sending' : ''}
            >
              {sending ? 'Sending…' : 'Send to ÖİDB'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const s = {
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 14, marginTop: 8 },
  th: { textAlign: 'left' as const, padding: '10px 14px', background: '#f9fafb', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase' as const, borderBottom: '1px solid #e5e7eb' },
  td: { padding: '12px 14px', verticalAlign: 'middle' as const },
  avatar: {
    width: 34, height: 34, borderRadius: '50%', background: PRIMARY, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0,
  } as React.CSSProperties,
  checkBtn: { background: '#1d3c6e', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 } as React.CSSProperties,
  decisionSelect: { padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer', minWidth: 160, fontFamily: 'inherit' } as React.CSSProperties,
  sendBtn: { padding: '10px 28px', background: PRIMARY, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 14 } as React.CSSProperties,
  filterBtn: { padding: '6px 14px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer', color: '#374151' } as React.CSSProperties,
  deadlineBanner: { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '9px 14px', fontSize: 13, color: '#92400e', margin: '12px 0' } as React.CSSProperties,
  errorBox: { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '9px 14px', fontSize: 13, color: '#b91c1c', marginBottom: 12 } as React.CSSProperties,
  successBox: { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '9px 14px', fontSize: 13, color: '#15803d', marginBottom: 12 } as React.CSSProperties,
};
