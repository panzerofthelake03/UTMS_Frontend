import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { adminApi, type AdminApplication } from '../../shared/api/adminApi';
import { applicationApi, type Document } from '../../shared/api/applicationApi';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import PdfViewerModal from '../../shared/components/PdfViewerModal';
import Spinner from '../../shared/components/Spinner';
import DocumentUpload from '../student/components/DocumentUpload';

const PRIMARY = '#8b1a1a';

interface FormValues { decision: string; note: string }
interface ExamFormValues { score: string; decision: 'PASS' | 'FAIL'; note: string }

export default function YdyoReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<AdminApplication | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ url: string; title: string } | null>(null);
  const [pdfLoading, setPdfLoading] = useState<number | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>();
  const examForm = useForm<ExamFormValues>({ defaultValues: { score: '', decision: 'PASS', note: '' } });

  const appId = Number(id);

  useEffect(() => {
    Promise.all([adminApi.ydyoList(), applicationApi.listDocuments(appId)])
      .then(([appsRes, docsRes]) => {
        setApp(appsRes.data.data.find((a) => a.id === appId) ?? null);
        setDocs(docsRes.data.data);
      })
      .finally(() => setLoading(false));
  }, [appId]);

  async function onSubmit(values: FormValues) {
    setServerError(null); setSuccessMessage(null);
    try {
      const res = await adminApi.ydyoEnglishReview(appId, { decision: values.decision, reviewerNote: values.note });
      setApp(res.data.data);
      if (values.decision === 'EXAM_REQUIRED') {
        setSuccessMessage(`Decision saved as EXAM_REQUIRED. Application remains in ${res.data.data.status}.`);
      } else {
        setSuccessMessage(`Decision saved as APPROVED. Application moved to ${res.data.data.status}.`);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setServerError(err.response?.data?.error?.message ?? 'Action failed.');
    }
  }

  async function handleViewPdf(doc: Document) {
    setPdfLoading(doc.id); setServerError(null);
    try {
      if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
      const res = await applicationApi.downloadDocument(appId, doc.id);
      const url = URL.createObjectURL(new Blob([res.data], { type: doc.mimeType || 'application/pdf' }));
      blobUrlRef.current = url;
      setViewingDoc({ url, title: doc.originalFilename });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setServerError(err.response?.data?.error?.message ?? 'Document could not be opened.');
    } finally { setPdfLoading(null); }
  }

  async function onExamReview(values: ExamFormValues) {
    setServerError(null); setSuccessMessage(null);
    try {
      const res = await adminApi.ydyoSetDecision(appId, values.decision);
      setApp(res.data.data);
      setSuccessMessage(
        values.decision === 'PASS'
          ? `Exam passed${values.score ? ` (score: ${values.score})` : ''}. Decision saved — will be forwarded to YGK in batch submission.`
          : `Exam failed${values.score ? ` (score: ${values.score})` : ''}. Decision saved — application will be rejected in batch submission.`
      );
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setServerError(err.response?.data?.error?.message ?? 'Action failed.');
    }
  }

  function closePdfModal() {
    setViewingDoc(null);
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
  }

  if (loading) return <div className="p-8"><Spinner /></div>;
  if (!app) return <div className="p-8 text-gray-500">Application not found.</div>;

  return (
    <div className="p-6 md:p-10 max-w-2xl">
      {/* Back */}
      <button
        onClick={() => navigate('/admin/ydyo/applications')}
        className="flex items-center gap-1 text-sm font-semibold mb-5 hover:opacity-75 transition-opacity"
        style={{ color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Students
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900 m-0">Application #{app.id}</h1>
        <ApplicationStatusBadge status={app.status} />
      </div>

      {/* Student info */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Student Information</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <InfoField label="Student" value={`${app.studentFirstName} ${app.studentLastName}`} />
          <InfoField label="Email" value={app.studentEmail} />
          <InfoField label="Term" value={app.term} />
          <InfoField label="GPA" value={app.gpa != null ? String(app.gpa) : '—'} />
        </div>
      </section>

      {/* Documents */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 m-0">Documents</h2>
        </div>
        <div className="p-5">
          {serverError && (
            <div className="mb-3 px-3 py-2 text-sm rounded-lg bg-red-50 border border-red-200 text-red-700">
              {serverError}
            </div>
          )}
          {docs.length === 0 ? (
            <p className="text-sm text-gray-400">No documents uploaded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[480px]">
                <thead>
                  <tr>
                    {['Type', 'File', 'Scan Status', 'Uploaded', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d) => (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-gray-700 text-xs">{d.documentType}</td>
                      <td className="px-3 py-2.5 text-gray-500 max-w-[120px] truncate text-xs">{d.originalFilename}</td>
                      <td className="px-3 py-2.5"><ScanBadge status={d.scanStatus} /></td>
                      <td className="px-3 py-2.5 text-gray-400 text-xs">{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => void handleViewPdf(d)}
                          disabled={pdfLoading === d.id}
                          className="px-2.5 py-1.5 text-xs font-semibold text-white rounded-lg transition-opacity disabled:opacity-50"
                          style={{ background: PRIMARY }}
                        >
                          {pdfLoading === d.id ? 'Loading…' : 'View PDF'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {app.status === 'WAITING_EXAM_RESULT' && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-600 mb-2">Upload English Exam Result</p>
              <DocumentUpload
                applicationId={appId}
                lockedDocumentType="ENGLISH_PROFICIENCY_EXAM_RESULT"
                onUploaded={(doc) => setDocs((prev) => [...prev, doc])}
              />
            </div>
          )}
        </div>
      </section>

      {/* English proficiency document review */}
      {app.status === 'UNDER_YDYO_REVIEW' && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 m-0">English Proficiency Document Decision</h2>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col gap-4">
            {serverError && (
              <div className="px-3 py-2 text-sm rounded-lg bg-red-50 border border-red-200 text-red-700">{serverError}</div>
            )}
            {successMessage && (
              <div className="px-3 py-2 text-sm rounded-lg bg-green-50 border border-green-200 text-green-800">{successMessage}</div>
            )}

            <div>
              <label htmlFor="decision" className="block text-xs font-semibold text-gray-600 mb-1">
                Decision <span className="text-red-500">*</span>
              </label>
              <select
                id="decision"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 bg-white"
                {...register('decision', { required: 'Required' })}
              >
                <option value="">Select…</option>
                <option value="APPROVED">APPROVED — Document is sufficient</option>
                <option value="EXAM_REQUIRED">EXAM REQUIRED — Student must take the exam</option>
              </select>
              {errors.decision && <span className="text-xs text-red-500">{errors.decision.message}</span>}
            </div>

            <div>
              <label htmlFor="note" className="block text-xs font-semibold text-gray-600 mb-1">
                Reviewer Note <span className="text-red-500">*</span>
              </label>
              <textarea
                id="note"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 resize-none"
                style={{ fontFamily: 'inherit' }}
                {...register('note', { required: 'Required' })}
              />
              {errors.note && <span className="text-xs text-red-500">{errors.note.message}</span>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="self-start px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-opacity disabled:opacity-50"
              style={{ background: PRIMARY }}
            >
              {isSubmitting ? 'Saving…' : 'Save Decision'}
            </button>
          </form>
        </section>
      )}

      {/* Exam result review */}
      {app.status === 'WAITING_EXAM_RESULT' && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 m-0">Exam Result Review</h2>
          </div>
          <form onSubmit={examForm.handleSubmit(onExamReview)} className="p-5 flex flex-col gap-4">
            <p className="text-xs text-gray-500 -mt-1">
              The student has uploaded their exam result document. Enter the score and make a decision.
            </p>
            {serverError && (
              <div className="px-3 py-2 text-sm rounded-lg bg-red-50 border border-red-200 text-red-700">{serverError}</div>
            )}
            {successMessage && (
              <div className="px-3 py-2 text-sm rounded-lg bg-green-50 border border-green-200 text-green-800">{successMessage}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="examScore" className="block text-xs font-semibold text-gray-600 mb-1">
                  Exam Score <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="examScore"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0 – 100"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30"
                  {...examForm.register('score')}
                />
              </div>
              <div>
                <label htmlFor="examDecision" className="block text-xs font-semibold text-gray-600 mb-1">
                  Decision <span className="text-red-500">*</span>
                </label>
                <select
                  id="examDecision"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 bg-white"
                  {...examForm.register('decision', { required: 'Required' })}
                >
                  <option value="PASS">PASS — Forward to YGK evaluation</option>
                  <option value="FAIL">FAIL — Reject application</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="examNote" className="block text-xs font-semibold text-gray-600 mb-1">
                Note <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="examNote"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 resize-none"
                style={{ fontFamily: 'inherit' }}
                {...examForm.register('note')}
              />
            </div>

            <button
              type="submit"
              disabled={examForm.formState.isSubmitting}
              className="self-start px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-opacity disabled:opacity-50"
              style={{ background: PRIMARY }}
            >
              {examForm.formState.isSubmitting ? 'Saving…' : 'Save Exam Decision'}
            </button>
          </form>
        </section>
      )}

      {viewingDoc && (
        <PdfViewerModal title={viewingDoc.title} url={viewingDoc.url} onClose={closePdfModal} />
      )}
    </div>
  );
}

function ScanBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string }> = {
    CLEAN:    { bg: 'bg-green-50',  text: 'text-green-700'  },
    INFECTED: { bg: 'bg-red-50',    text: 'text-red-700'    },
    PENDING:  { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  };
  const c = cfg[status] ?? { bg: 'bg-gray-50', text: 'text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${c.bg} ${c.text}`}>
      {status}
    </span>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-800">{value}</div>
    </div>
  );
}
