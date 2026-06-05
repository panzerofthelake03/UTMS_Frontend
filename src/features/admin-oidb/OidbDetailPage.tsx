import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi, type AdminApplication, type StudentProfile } from '../../shared/api/adminApi';
import { applicationApi, type Document } from '../../shared/api/applicationApi';
import { useForm } from 'react-hook-form';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import PdfViewerModal from '../../shared/components/PdfViewerModal';
import Spinner from '../../shared/components/Spinner';

const PRIMARY = '#8b1a1a';

interface FormValues { note: string }
interface ViewingDoc { url: string; title: string }

export default function OidbDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<AdminApplication | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<ViewingDoc | null>(null);
  const [pdfLoading, setPdfLoading] = useState<number | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { note: 'Belgeler eksiksiz görünüyor, YDYO\'ya yönlendiriliyor.' },
  });

  const appId = Number(id);

  useEffect(() => {
    Promise.all([
      adminApi.oidbList(),
      applicationApi.listDocuments(appId),
      adminApi.oidbGetStudentProfile(appId),
    ]).then(([appsRes, docsRes, profileRes]) => {
      setApp(appsRes.data.data.find((a) => a.id === appId) ?? null);
      setDocs(docsRes.data.data);
      setProfile(profileRes.data.data);
    }).finally(() => setLoading(false));
  }, [appId]);

  async function onForward(values: FormValues) {
    setServerError(null);
    try {
      if (app?.status === 'SUBMITTED') {
        await adminApi.oidbTakeReview(appId);
      }
      const res = await adminApi.oidbForwardYdyo(appId, values.note);
      setApp(res.data.data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setServerError(err.response?.data?.error?.message ?? 'İşlem başarısız.');
    }
  }

  async function handleViewPdf(doc: Document) {
    setPdfLoading(doc.id);
    setServerError(null);
    try {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      const res = await applicationApi.downloadDocument(appId, doc.id);
      const url = URL.createObjectURL(new Blob([res.data], { type: doc.mimeType || 'application/pdf' }));
      blobUrlRef.current = url;
      setViewingDoc({ url, title: doc.originalFilename });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setServerError(err.response?.data?.error?.message ?? 'Belge açılamadı.');
    } finally {
      setPdfLoading(null);
    }
  }

  function closePdfModal() {
    setViewingDoc(null);
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }

  if (loading) return <Spinner />;
  if (!app) return <div className="text-gray-500">Başvuru bulunamadı.</div>;

  const canForward = ['SUBMITTED', 'UNDER_OIDB_REVIEW'].includes(app.status);

  return (
    <div className="max-w-3xl">
      {/* Back */}
      <button
        onClick={() => navigate('/admin/oidb/applications')}
        className="flex items-center gap-1 text-sm font-semibold mb-5 hover:opacity-75 transition-opacity"
        style={{ color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Başvuru Listesine Dön
      </button>

      {/* Title row */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-900 m-0">Başvuru #{app.id}</h2>
        <ApplicationStatusBadge status={app.status} />
      </div>

      {/* ─── UC 3.2: Student Identity Card ─── */}
      <section className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100"
             style={{ background: '#fdf8f8' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
               style={{ color: PRIMARY }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-sm font-semibold" style={{ color: PRIMARY }}>Öğrenci Kimlik Bilgileri</span>
        </div>

        <div className="p-5">
          {/* Name & Email row */}
          <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-gray-100">
            <div className="min-w-[180px]">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Ad Soyad</div>
              <div className="text-sm font-semibold text-gray-800">
                {app.studentFirstName} {app.studentLastName}
              </div>
            </div>
            <div className="min-w-[200px]">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">E-posta</div>
              <div className="text-sm text-gray-700">{app.studentEmail}</div>
            </div>
            {app.studentNumber && (
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Öğrenci No</div>
                <div className="text-sm text-gray-700">{app.studentNumber}</div>
              </div>
            )}
          </div>

          {/* Identity grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <IdentityField label="Uyruk" value={profile?.nationality} />
            <IdentityField
              label="Kimlik Türü"
              value={profile?.identityDocumentType === 'TC_ID' ? 'T.C. Kimlik' :
                     profile?.identityDocumentType === 'PASSPORT' ? 'Pasaport' :
                     profile?.identityDocumentType}
            />
            {profile?.identityDocumentType === 'TC_ID' ? (
              <IdentityField label="T.C. Kimlik No" value={profile.tcIdentityNumber} masked />
            ) : (
              <IdentityField label="Pasaport No" value={profile?.passportNumber} />
            )}
            <IdentityField
              label="Doğum Tarihi"
              value={profile?.dateOfBirth
                ? new Date(profile.dateOfBirth).toLocaleDateString('tr-TR')
                : null}
            />
            {profile?.passportExpirationDate && (
              <IdentityField
                label="Pasaport Geçerlilik"
                value={new Date(profile.passportExpirationDate).toLocaleDateString('tr-TR')}
              />
            )}
            <IdentityField label="Mevcut Program" value={profile?.currentProgram} />
            <IdentityField label="Mevcut Üniversite" value={profile?.currentUniversity} />
            <IdentityField
              label="GNO"
              value={app.gpa != null ? String(app.gpa) : null}
            />
            <IdentityField label="Bölüm (IYTE)" value={app.department} />
            <IdentityField label="Fakülte (IYTE)" value={app.faculty} />
          </div>
        </div>
      </section>

      {/* ─── Application Details ─── */}
      <section className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700"
             style={{ background: '#fafafa' }}>
          Başvuru Detayları
        </div>
        <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-3">
          <IdentityField label="Dönem" value={app.term} />
          <IdentityField
            label="Başvuru Tarihi"
            value={app.submittedAt ? new Date(app.submittedAt).toLocaleString('tr-TR') : '—'}
          />
          {app.applicationNote && (
            <div className="col-span-2">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Başvuru Notu</div>
              <div className="text-sm text-gray-700">{app.applicationNote}</div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Documents ─── */}
      <section className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700"
             style={{ background: '#fafafa' }}>
          Belgeler
        </div>
        <div className="p-5">
          {serverError && (
            <div className="mb-3 px-3 py-2 text-sm rounded-lg bg-red-50 border border-red-200 text-red-700">
              {serverError}
            </div>
          )}
          {docs.length === 0 ? (
            <p className="text-sm text-gray-400">Henüz belge yüklenmemiş.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  {['Belge Türü', 'Dosya Adı', 'Tarama', 'Yüklenme', ''].map((h) => (
                    <th key={h}
                        className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-gray-700">{d.documentType}</td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-[160px] truncate">{d.originalFilename}</td>
                    <td className="px-3 py-2.5">
                      <ScanBadge status={d.scanStatus} />
                    </td>
                    <td className="px-3 py-2.5 text-gray-400 text-xs">
                      {new Date(d.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => void handleViewPdf(d)}
                        disabled={pdfLoading === d.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-opacity disabled:opacity-50"
                        style={{ background: PRIMARY }}
                      >
                        {pdfLoading === d.id ? (
                          <>
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Yükleniyor…
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            PDF Görüntüle
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ─── Forward to YDYO ─── */}
      {canForward && (
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700"
               style={{ background: '#fafafa' }}>
            YDYO'ya Yönlendir
          </div>
          <form onSubmit={handleSubmit(onForward)} className="p-5 flex flex-col gap-3">
            {serverError && (
              <div className="px-3 py-2 text-sm rounded-lg bg-red-50 border border-red-200 text-red-700">
                {serverError}
              </div>
            )}
            <div>
              <label htmlFor="note" className="block text-xs font-semibold text-gray-600 mb-1">
                Yönlendirme Notu
              </label>
              <textarea
                id="note"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 resize-none"
                style={{ fontFamily: 'inherit' }}
                {...register('note', { required: 'Not gereklidir.' })}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="self-start flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-opacity disabled:opacity-50"
              style={{ background: PRIMARY }}
            >
              {isSubmitting ? 'Yönlendiriliyor…' : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                  YDYO'ya Yönlendir
                </>
              )}
            </button>
          </form>
        </section>
      )}

      {/* PDF Viewer Modal */}
      {viewingDoc && (
        <PdfViewerModal
          title={viewingDoc.title}
          url={viewingDoc.url}
          onClose={closePdfModal}
        />
      )}
    </div>
  );
}

function IdentityField({ label, value, masked }: { label: string; value?: string | null; masked?: boolean }) {
  const display = value ?? '—';
  const shown = masked && value ? `${value.slice(0, 3)}${'*'.repeat(Math.max(0, value.length - 5))}${value.slice(-2)}` : display;
  return (
    <div>
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm text-gray-800 font-medium">{shown}</div>
    </div>
  );
}

function ScanBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    CLEAN:    { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Temiz' },
    INFECTED: { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Virüslü' },
    PENDING:  { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Bekliyor' },
  };
  const c = cfg[status] ?? { bg: 'bg-gray-50', text: 'text-gray-600', label: status };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
