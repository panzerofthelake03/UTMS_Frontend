import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationApi, type Application } from '../../shared/api/applicationApi';
import Spinner from '../../shared/components/Spinner';

const PRIMARY = '#8b1a1a';

export default function ViewResultsPage() {
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [docError, setDocError] = useState<string | null>(null);

  useEffect(() => {
    applicationApi.list().then((res) => {
      // Find the finalized application
      const finalized = res.data.data.find(
        (a) => a.status === 'ACCEPTED' || a.status === 'REJECTED'
      ) ?? null;
      setApp(finalized);
    }).finally(() => setLoading(false));
  }, []);

  async function handleDownloadLetter() {
    if (!app) return;
    setDocError(null);
    try {
      const res = await applicationApi.listDocuments(app.id);
      const letter = res.data.data.find((d) => d.documentType === 'ACCEPTANCE_LETTER');
      if (!letter) {
        setDocError('Acceptance letter is not yet available. Please try again later.');
        return;
      }
      const blob = await applicationApi.downloadDocument(app.id, letter.id);
      const url = URL.createObjectURL(new Blob([blob.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `acceptance-letter-${app.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setDocError('Document could not be generated. Please try again later.');
    }
  }

  if (loading) return <Spinner />;

  // UC 1.9 3a: Process not finalized
  if (!app || (app.status !== 'ACCEPTED' && app.status !== 'REJECTED')) {
    return (
      <div style={{ maxWidth: 600 }}>
        <h2 style={s.pageTitle}>Application Result</h2>
        <div style={s.card}>
          <div style={s.infoBox}>
            ℹ The evaluation process is still ongoing. Results have not been announced yet.
          </div>
          <button onClick={() => navigate('/student/status')} style={s.btn}>
            Track Application Status
          </button>
        </div>
      </div>
    );
  }

  const isAccepted = app.status === 'ACCEPTED';

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={s.pageTitle}>Application Result</h2>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
        2025–2026 Academic Year Transfer Application
      </p>

      <div style={s.card}>
        {/* Result icon + status */}
        <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            border: `4px solid ${isAccepted ? '#16a34a' : '#dc2626'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 28,
          }}>
            {isAccepted ? '✓' : '✕'}
          </div>
          <div style={{
            fontSize: 28, fontWeight: 800,
            color: isAccepted ? '#16a34a' : '#dc2626',
            letterSpacing: 1,
          }}>
            {isAccepted ? 'ACCEPTED' : 'REJECTED'}
          </div>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 6 }}>
            {isAccepted
              ? 'Congratulations! You have been placed in the Primary List (Asil).'
              : 'Your application has not been accepted.'}
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 20px' }} />

        {/* Placement Details */}
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Placement Details</h3>

        <div style={s.detailRow}>
          <span style={s.detailIcon}>🏛</span>
          <div>
            <div style={s.detailLabel}>Department</div>
            <div style={s.detailValue}>{app.targetDepartment ?? 'Computer Engineering'}</div>
          </div>
        </div>
        <div style={s.detailRow}>
          <span style={s.detailIcon}>📅</span>
          <div>
            <div style={s.detailLabel}>Academic Term</div>
            <div style={s.detailValue}>{app.term}</div>
          </div>
        </div>

        {/* UC 1.9 4a: Rejection reason */}
        {!isAccepted && (
          <div style={s.rejectionBox}>
            <strong>Rejection Reason:</strong> Your application did not meet the requirements.
            Please contact support for more information.
          </div>
        )}

        {/* Official note */}
        {isAccepted && (
          <div style={s.noteBox}>
            <span style={{ color: '#1d4ed8' }}>ℹ</span>
            <span style={{ fontSize: 13, color: '#1e40af', marginLeft: 8 }}>
              Important Registration Information: Registration dates are between Sep 20–25. Please bring your original documents.
            </span>
          </div>
        )}

        {docError && <div style={s.errorBox}>{docError}</div>}

        {/* Actions */}
        {isAccepted && (
          <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            <button onClick={() => void handleDownloadLetter()} style={s.downloadBtn}>
              ⬇ Download Acceptance Letter (PDF)
              <span style={{ marginLeft: 8, fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 4 }}>
                Digitally Signed
              </span>
            </button>
          </div>
        )}

        <div style={{ marginTop: 16, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
          Application ID: UTM-2025-{app.id} • Issued: {new Date(app.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

const s = {
  pageTitle: { fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px' } as React.CSSProperties,
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 28px' } as React.CSSProperties,
  infoBox: { background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 6, padding: '12px 16px', fontSize: 13, color: '#1d4ed8', marginBottom: 16 } as React.CSSProperties,
  btn: { padding: '10px 20px', background: PRIMARY, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14 } as React.CSSProperties,
  detailRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f3f4f6' } as React.CSSProperties,
  detailIcon: { fontSize: 20, width: 32, textAlign: 'center' as const, color: PRIMARY },
  detailLabel: { fontSize: 11, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  detailValue: { fontSize: 15, fontWeight: 600, color: '#111827', marginTop: 2 } as React.CSSProperties,
  noteBox: { background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 6, padding: '10px 14px', marginTop: 16, display: 'flex', alignItems: 'flex-start' } as React.CSSProperties,
  rejectionBox: { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 14px', marginTop: 12, fontSize: 13, color: '#b91c1c' } as React.CSSProperties,
  errorBox: { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#b91c1c', marginTop: 12 } as React.CSSProperties,
  downloadBtn: {
    padding: '11px 20px', background: PRIMARY, color: '#fff', border: 'none',
    borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center',
  } as React.CSSProperties,
};
