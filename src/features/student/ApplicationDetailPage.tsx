import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { applicationApi, type Application, type Document, type TimelineEntry } from '../../shared/api/applicationApi';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import PdfViewerModal from '../../shared/components/PdfViewerModal';
import Spinner from '../../shared/components/Spinner';
import Timeline from './components/Timeline';
import DocumentUpload from './components/DocumentUpload';

const PRIMARY = '#8b1a1a';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ url: string; title: string } | null>(null);
  const [pdfLoading, setPdfLoading] = useState<number | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const appId = Number(id);

  useEffect(() => {
    Promise.all([
      applicationApi.get(appId),
      applicationApi.timeline(appId),
      applicationApi.listDocuments(appId),
    ]).then(([a, t, d]) => {
      setApp(a.data.data);
      setTimeline(t.data.data);
      setDocs(d.data.data);
    }).finally(() => setLoading(false));
  }, [appId]);

  async function handleSubmit() {
    if (!app) return;
    setSubmitting(true); setSubmitError(null);
    try {
      const res = await applicationApi.submit(appId);
      setApp(res.data.data);
      const t = await applicationApi.timeline(appId);
      setTimeline(t.data.data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setSubmitError(err.response?.data?.error?.message ?? 'Submit failed.');
    } finally { setSubmitting(false); }
  }

  async function handleDeleteApplication() {
    if (!app) return;
    if (!window.confirm('Delete this draft application? This cannot be undone.')) return;
    setDeleting(true); setSubmitError(null);
    try {
      await applicationApi.deleteApplication(app.id);
      navigate('/student/applications');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setSubmitError(err.response?.data?.error?.message ?? 'Delete failed.');
    } finally { setDeleting(false); }
  }

  async function handleViewPdf(doc: Document) {
    setPdfLoading(doc.id); setDocError(null);
    try {
      if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
      const res = await applicationApi.downloadDocument(appId, doc.id);
      const url = URL.createObjectURL(new Blob([res.data], { type: doc.mimeType || 'application/pdf' }));
      blobUrlRef.current = url;
      setViewingDoc({ url, title: doc.originalFilename });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setDocError(err.response?.data?.error?.message ?? 'Document could not be opened.');
    } finally { setPdfLoading(null); }
  }

  function closePdfModal() {
    setViewingDoc(null);
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
  }

  async function handleDelete(documentId: number) {
    setDocError(null);
    try {
      await applicationApi.deleteDocument(appId, documentId);
      setDocs((prev) => prev.filter((d) => d.id !== documentId));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setDocError(err.response?.data?.error?.message ?? 'Document delete failed.');
    }
  }

  if (loading) return <div className="p-8"><Spinner /></div>;
  if (!app) return <div className="p-8 text-gray-500">Application not found.</div>;

  const canSubmit = app.status === 'DRAFT';
  const canUploadDocuments = app.status === 'DRAFT' || app.status === 'WAITING_EXAM_RESULT';
  const isWaitingExamResult = app.status === 'WAITING_EXAM_RESULT';

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => navigate('/student/applications')}
        className="flex items-center gap-1 text-sm font-semibold mb-5 hover:opacity-75 transition-opacity"
        style={{ color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Applications
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900 m-0">Application #{app.id}</h1>
        <ApplicationStatusBadge status={app.status} />
      </div>

      {/* Details card */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 m-0">Details</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-8 gap-y-4">
            <DetailField label="Term" value={app.term} />
            <DetailField label="Status" value={app.status.replace(/_/g, ' ')} />
            <DetailField label="Submitted" value={app.submittedAt ? new Date(app.submittedAt).toLocaleString() : '—'} />
            <DetailField label="Created" value={new Date(app.createdAt).toLocaleString()} />
            {app.applicationNote && (
              <div className="col-span-2">
                <DetailField label="Note" value={app.applicationNote} />
              </div>
            )}
          </div>

          {canSubmit && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              {submitError && (
                <div className="mb-3 px-3 py-2 text-sm rounded-lg bg-red-50 border border-red-200 text-red-700">
                  {submitError}
                </div>
              )}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-opacity disabled:opacity-50"
                  style={{ background: PRIMARY }}
                >
                  {submitting ? 'Submitting…' : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Submit Application
                    </>
                  )}
                </button>
                <button
                  onClick={() => void handleDeleteApplication()}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 rounded-xl transition disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Delete Draft'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Documents card */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 m-0">Documents</h2>
        </div>
        <div className="p-5">
          {docError && (
            <div className="mb-3 px-3 py-2 text-sm rounded-lg bg-red-50 border border-red-200 text-red-700">
              {docError}
            </div>
          )}

          {canUploadDocuments && (
            <div className="mb-4">
              <DocumentUpload
                applicationId={appId}
                lockedDocumentType={isWaitingExamResult ? 'ENGLISH_PROFICIENCY_EXAM_RESULT' : undefined}
                onUploaded={(doc) => setDocs((prev) => [...prev, doc])}
              />
            </div>
          )}

          {docs.length === 0 ? (
            <p className="text-sm text-gray-400">No documents uploaded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[520px]">
                <thead>
                  <tr>
                    {['Type', 'File', 'Scan Status', 'Uploaded', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d) => (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-gray-700 text-xs">{d.documentType}</td>
                      <td className="px-3 py-2.5 text-gray-500 max-w-[140px] truncate text-xs">{d.originalFilename}</td>
                      <td className="px-3 py-2.5"><ScanBadge status={d.scanStatus} /></td>
                      <td className="px-3 py-2.5 text-gray-400 text-xs">{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => void handleViewPdf(d)}
                            disabled={pdfLoading === d.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white rounded-lg transition-opacity disabled:opacity-50"
                            style={{ background: PRIMARY }}
                          >
                            {pdfLoading === d.id ? (
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : '👁'} View PDF
                          </button>
                          {canSubmit && (
                            <button
                              onClick={() => void handleDelete(d.id)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Timeline card */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 m-0">Timeline</h2>
        </div>
        <div className="p-5">
          <Timeline entries={timeline} />
        </div>
      </section>

      {viewingDoc && (
        <PdfViewerModal title={viewingDoc.title} url={viewingDoc.url} onClose={closePdfModal} />
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-800">{value}</div>
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
