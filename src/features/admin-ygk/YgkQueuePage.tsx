import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type AdminApplication, type EvaluationResponse } from '../../shared/api/adminApi';
import Spinner from '../../shared/components/Spinner';
import EmptyState from '../../shared/components/EmptyState';

const PRIMARY = '#8b1a1a';

// Mirrors CompositeScoreService: (gpa/4)*60 + (langScore/100)*40
function calcScore(gpa: number | null, languageScore: number): number {
  const g = Math.max(0, Math.min(gpa ?? 0, 4));
  const l = Math.max(0, Math.min(languageScore, 100));
  return parseFloat(((g / 4) * 60 + (l / 100) * 40).toFixed(2));
}

function scoreColor(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#ca8a04';
  return '#dc2626';
}

interface RowState {
  submitting: boolean;
  sendingBack: boolean;
  error: string | null;
}

export default function YgkQueuePage() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [evals, setEvals] = useState<Record<number, EvaluationResponse | null>>({});
  const [rows, setRows] = useState<Record<number, RowState>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.ygkList().then(async (r) => {
      const list = r.data.data;
      setApps(list);

      const evalMap: Record<number, EvaluationResponse | null> = {};
      const rowMap: Record<number, RowState> = {};
      await Promise.all(
        list.map((a) =>
          adminApi.ygkGetEvaluation(a.id)
            .then((er) => { evalMap[a.id] = er.data.data; })
            .catch(() => { evalMap[a.id] = null; })
        )
      );
      for (const a of list) {
        rowMap[a.id] = { submitting: false, sendingBack: false, error: null };
      }
      setEvals(evalMap);
      setRows(rowMap);
    }).finally(() => setLoading(false));
  }, []);

  function setRow(id: number, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function submitDecision(app: AdminApplication, decision: 'ACCEPTED' | 'REJECTED') {
    const row = rows[app.id];
    const ev = evals[app.id];
    if (!row) return;

    const langScore = ev?.languageScore ?? null;
    if (langScore === null || (app.yksScore ?? null) === null) {
      setRow(app.id, { error: 'YKS puanı henüz kaydedilmemiş. OİDB\'ye geri gönderin.' });
      return;
    }
    if (decision === 'ACCEPTED' && !ev?.deptConditionsVerified) {
      setRow(app.id, { error: 'Kabul için önce bölüm koşullarını doğrulamanız gerekiyor.' });
      return;
    }

    setRow(app.id, { submitting: true, error: null });
    try {
      await adminApi.ygkEvaluate(app.id, {
        gpaScore: app.gpa ?? 0,
        languageScore: langScore,
        decision,
        deptConditionsVerified: ev?.deptConditionsVerified ?? false,
      });
      setApps((prev) => prev.filter((a) => a.id !== app.id));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setRow(app.id, { submitting: false, error: err.response?.data?.error?.message ?? 'İşlem başarısız.' });
    }
  }

  async function sendBackToOidb(app: AdminApplication) {
    setRow(app.id, { sendingBack: true, error: null });
    try {
      await adminApi.ygkSendBackToOidb(app.id);
      setApps((prev) => prev.filter((a) => a.id !== app.id));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setRow(app.id, { sendingBack: false, error: err.response?.data?.error?.message ?? 'Geri gönderme başarısız.' });
    }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111' }}>Transfer Değerlendirme Tablosu</h2>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
          Öğrenci transfer başvurularını inceleyin ve onaylayın.
        </p>
      </div>

      {apps.length === 0 ? (
        <EmptyState message="Değerlendirilecek başvuru yok." />
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '26%' }} />
            </colgroup>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Öğrenci Bilgisi', 'GNO', 'YKS Puanı', 'Bölüm Koşulları', 'Toplam Puan', 'İntibak', 'Karar'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => {
                const row = rows[app.id];
                const ev = evals[app.id];
                if (!row) return null;

                const langScore = ev?.languageScore ?? null;       // normalized 0-100 for formula
                const yksScore = app.yksScore ?? null;              // raw 0-500 for display
                const deptVerified = ev?.deptConditionsVerified ?? false;
                const score = langScore !== null && deptVerified
                  ? calcScore(app.gpa, langScore)
                  : null;

                return (
                  <tr key={app.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    {/* Student */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: '#111' }}>
                        {app.studentFirstName} {app.studentLastName}
                      </div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{app.studentEmail}</div>
                    </td>

                    {/* GPA */}
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600 }}>{app.gpa != null ? app.gpa.toFixed(2) : '—'}</span>
                    </td>

                    {/* YKS Score — shows raw student score (0-500); language_score is normalized (÷5) for formula */}
                    <td style={tdStyle}>
                      {app.yksScore !== null && app.yksScore !== undefined ? (
                        <span style={{ display: 'inline-block', padding: '4px 10px', background: '#f3f4f6', borderRadius: 6, fontWeight: 600, fontSize: 13, color: '#374151' }}>
                          {Number(app.yksScore).toFixed(2)}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#f97316', fontStyle: 'italic' }}>Puan girilmemiş</span>
                      )}
                    </td>

                    {/* Dept Conditions — navigates to detail page */}
                    <td style={tdStyle}>
                      <button
                        onClick={() => navigate(`/admin/ygk/applications/${app.id}/dept-conditions`)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 6,
                          border: '1px solid',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: deptVerified ? '#dcfce7' : '#fff7ed',
                          borderColor: deptVerified ? '#16a34a' : '#f97316',
                          color: deptVerified ? '#15803d' : '#c2410c',
                        }}
                      >
                        {deptVerified ? '✓ Doğrulandı' : 'Koşulları Kontrol Et'}
                      </button>
                    </td>

                    {/* Total Point */}
                    <td style={tdStyle}>
                      {score !== null ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 44, height: 44, borderRadius: '50%',
                          background: `${scoreColor(score)}18`, color: scoreColor(score),
                          fontWeight: 700, fontSize: 14,
                        }}>
                          {Math.round(score)}
                        </span>
                      ) : (
                        <span style={{ color: '#d1d5db', fontSize: 20 }}>—</span>
                      )}
                    </td>

                    {/* Intibak */}
                    <td style={tdStyle}>
                      <button
                        onClick={() => navigate(`/admin/intibak/applications/${app.id}`)}
                        style={{ background: 'none', border: 'none', color: PRIMARY, fontWeight: 600, fontSize: 12, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                      >
                        İntibak Hazırla
                      </button>
                    </td>

                    {/* Decision */}
                    <td style={tdStyle}>
                      {row.error && (
                        <div style={{ fontSize: 11, color: '#dc2626', marginBottom: 4, lineHeight: 1.3 }}>{row.error}</div>
                      )}
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <button
                          disabled={row.submitting || row.sendingBack}
                          onClick={() => void submitDecision(app, 'ACCEPTED')}
                          style={{ ...decisionBtn, background: '#16a34a', opacity: row.submitting ? 0.6 : 1 }}
                        >
                          Kabul
                        </button>
                        <button
                          disabled={row.submitting || row.sendingBack}
                          onClick={() => void submitDecision(app, 'REJECTED')}
                          style={{ ...decisionBtn, background: '#dc2626', opacity: row.submitting ? 0.6 : 1 }}
                        >
                          Reddet
                        </button>
                        {yksScore === null && (
                          <button
                            disabled={row.sendingBack || row.submitting}
                            onClick={() => void sendBackToOidb(app)}
                            style={{ ...decisionBtn, background: '#6b7280', fontSize: 11, opacity: row.sendingBack ? 0.6 : 1 }}
                            title="YKS puanı eksik — OİDB'ye geri gönder"
                          >
                            {row.sendingBack ? '...' : 'OİDB\'ye Gönder'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 20px', borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
            <button
              disabled={apps.length > 0}
              onClick={() => navigate('/admin/ygk/placement')}
              style={{
                padding: '9px 20px',
                background: apps.length === 0 ? PRIMARY : '#e5e7eb',
                color: apps.length === 0 ? '#fff' : '#9ca3af',
                border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13,
                cursor: apps.length === 0 ? 'pointer' : 'not-allowed',
              }}
              title={apps.length > 0 ? `${apps.length} başvuru henüz değerlendirilmedi` : 'Yerleştirme listesine git'}
            >
              Dekanlık Ofisine Gönder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 16px', fontSize: 12, fontWeight: 600,
  color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid #e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = { padding: '14px 16px', verticalAlign: 'middle', overflow: 'hidden' };
const decisionBtn: React.CSSProperties = {
  padding: '6px 12px', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer',
};
