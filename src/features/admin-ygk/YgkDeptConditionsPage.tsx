import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi, type AdminApplication, type EvaluationResponse, type StudentProfile } from '../../shared/api/adminApi';
import { applicationApi, type Document } from '../../shared/api/applicationApi';
import PdfViewerModal from '../../shared/components/PdfViewerModal';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import Spinner from '../../shared/components/Spinner';

const PRIMARY = '#8b1a1a';

export default function YgkDeptConditionsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const appId = Number(id);

  const [app, setApp] = useState<AdminApplication | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ title: string; url: string } | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminApi.ygkList(),
      adminApi.ygkGetStudentProfile(appId),
      applicationApi.listDocuments(appId),
      adminApi.ygkGetEvaluation(appId).catch(() => null),
    ]).then(([listRes, profileRes, docsRes, evalRes]) => {
      setApp(listRes.data.data.find((a) => a.id === appId) ?? null);
      setProfile(profileRes.data.data);
      setDocs(docsRes.data.data);
      setEvaluation(evalRes?.data.data ?? null);
    }).finally(() => setLoading(false));
  }, [appId]);

  async function handleSave(verified: boolean) {
    setSaving(true);
    setError(null);
    try {
      const res = await adminApi.ygkSaveDeptConditions(appId, verified);
      setEvaluation(res.data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setError(err.response?.data?.error?.message ?? 'Kayıt başarısız.');
    } finally {
      setSaving(false);
    }
  }

  async function handleViewPdf(doc: Document) {
    try {
      const res = await applicationApi.downloadDocument(appId, doc.id);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setViewingDoc({ title: doc.documentType, url });
    } catch { /* ignore */ }
  }

  function closePdfModal() {
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    setViewingDoc(null);
  }

  if (loading) return <Spinner />;
  if (!app || !profile) return <div style={{ padding: '2rem', color: '#6b7280' }}>Başvuru bulunamadı.</div>;

  const currentlyVerified = evaluation?.deptConditionsVerified ?? false;

  return (
    <div style={{ padding: '2rem', maxWidth: 820 }}>
      {viewingDoc && <PdfViewerModal title={viewingDoc.title} url={viewingDoc.url} onClose={closePdfModal} />}

      <button
        onClick={() => navigate('/admin/ygk/applications')}
        style={{ background: 'none', border: 'none', color: PRIMARY, fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: '0 0 16px', display: 'block' }}
      >
        ← Değerlendirme Tablosuna Dön
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Başvuru #{app.id} — Bölüm Koşulları</h2>
        <ApplicationStatusBadge status={app.status} />
      </div>

      {/* Student Identity */}
      <Section title="Öğrenci Kimlik Bilgileri">
        <Grid>
          <Field label="Ad Soyad" value={profile.fullName} />
          <Field label="E-posta" value={profile.email} />
          <Field label="Öğrenci No" value={app.studentNumber} />
          <Field label="Uyruk" value={profile.nationality} />
          <Field label="Kimlik Türü" value={profile.identityDocumentType} />
          <Field label="T.C. Kimlik No" value={profile.tcIdentityNumber ? mask(profile.tcIdentityNumber) : null} />
          <Field label="Doğum Tarihi" value={profile.dateOfBirth ? String(profile.dateOfBirth) : null} />
          <Field label="Mevcut Program" value={profile.currentProgram} />
          <Field label="Mevcut Üniversite" value={profile.currentUniversity} />
          <Field label="GNO" value={app.gpa != null ? String(app.gpa) : '—'} />
          <Field label="Bölüm (İYTE)" value={app.department} />
          <Field label="Fakülte (İYTE)" value={app.faculty} />
        </Grid>
      </Section>

      {/* Application Details */}
      <Section title="Başvuru Detayları">
        <Grid>
          <Field label="Dönem" value={app.term} />
          <Field label="Başvuru Tarihi" value={app.submittedAt ? new Date(app.submittedAt).toLocaleString('tr-TR') : '—'} />
        </Grid>
      </Section>

      {/* Documents */}
      <Section title="Belgeler">
        {docs.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Belge yüklenmemiş.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Belge Türü', 'Dosya Adı', 'Tarama', 'Yüklenme', ''].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 12px', fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{d.documentType}</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.originalFilename}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: d.scanStatus === 'CLEAN' ? '#dcfce7' : '#fef2f2', color: d.scanStatus === 'CLEAN' ? '#15803d' : '#b91c1c' }}>
                      {d.scanStatus === 'CLEAN' ? 'Temiz' : d.scanStatus}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#9ca3af', fontSize: 12 }}>{new Date(d.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <button onClick={() => void handleViewPdf(d)} style={{ background: PRIMARY, color: '#fff', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      PDF Görüntüle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Dept Conditions Decision */}
      <Section title="Bölüm Koşulları Kararı">
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 0, marginBottom: 16 }}>
          Öğrencinin bölüme özel koşulları karşılayıp karşılamadığını belirleyin. Bu karar kaydedilir ancak başvuruyu dekanlığa göndermez.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <button
            onClick={() => void handleSave(true)}
            disabled={saving}
            style={{
              padding: '10px 22px',
              background: currentlyVerified ? '#16a34a' : '#fff',
              color: currentlyVerified ? '#fff' : '#16a34a',
              border: '2px solid #16a34a',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {currentlyVerified ? '✓ Koşullar Doğrulandı' : 'Bölüm Koşullarını Doğrula'}
          </button>
          <button
            onClick={() => void handleSave(false)}
            disabled={saving}
            style={{
              padding: '10px 22px',
              background: !currentlyVerified ? '#dc2626' : '#fff',
              color: !currentlyVerified ? '#fff' : '#dc2626',
              border: '2px solid #dc2626',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {!currentlyVerified ? '✕ Koşullar Doğrulanmadı' : 'Doğrulamayı Geri Al'}
          </button>
        </div>

        {saved && (
          <div style={{ padding: '8px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 13, color: '#15803d', fontWeight: 600 }}>
            Karar kaydedildi.
          </div>
        )}
        {error && (
          <div style={{ padding: '8px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 13, color: '#b91c1c' }}>
            {error}
          </div>
        )}
      </Section>
    </div>
  );
}

function mask(val: string) {
  if (val.length <= 4) return val;
  return val.slice(0, 3) + '*'.repeat(val.length - 4) + val.slice(-2);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6', fontSize: 13, fontWeight: 700, color: PRIMARY }}>{title}</div>
      <div style={{ padding: '16px' }}>{children}</div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px 24px' }}>{children}</div>;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{value ?? '—'}</div>
    </div>
  );
}
