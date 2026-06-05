import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationApi, type Application } from '../../shared/api/applicationApi';
import Spinner from '../../shared/components/Spinner';

export default function ViewResultsPage() {
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [docError, setDocError] = useState<string | null>(null);

  useEffect(() => {
    applicationApi.list().then((res) => {
      const finalized = res.data.data.find((a) => a.status === 'ACCEPTED' || a.status === 'REJECTED') ?? null;
      setApp(finalized);
    }).finally(() => setLoading(false));
  }, []);

  async function handleDownloadLetter() {
    if (!app) return;
    setDocError(null);
    try {
      const res = await applicationApi.listDocuments(app.id);
      const letter = res.data.data.find((d) => d.documentType === 'ACCEPTANCE_LETTER');
      if (!letter) { setDocError('Acceptance letter is not yet available. Please try again later.'); return; }
      const blob = await applicationApi.downloadDocument(app.id, letter.id);
      const url = URL.createObjectURL(new Blob([blob.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url; link.download = `acceptance-letter-${app.id}.pdf`;
      link.click(); URL.revokeObjectURL(url);
    } catch {
      setDocError('Document could not be generated. Please try again later.');
    }
  }

  if (loading) return <div className="p-8"><Spinner /></div>;

  if (!app || (app.status !== 'ACCEPTED' && app.status !== 'REJECTED')) {
    return (
      <div className="p-6 md:p-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Application Result</h1>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-lg shadow-sm">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm text-blue-700">
            ℹ The evaluation process is still ongoing. Results have not been announced yet.
          </div>
          <button onClick={() => navigate('/student/status')}
            className="px-5 py-2.5 bg-[#8b1a1a] text-white rounded-lg text-sm font-semibold hover:bg-[#6b1414] transition">
            Track Application Status
          </button>
        </div>
      </div>
    );
  }

  const isAccepted = app.status === 'ACCEPTED';

  return (
    <div className="p-6 md:p-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Application Result</h1>
      <p className="text-sm text-gray-400 mb-6">2025–2026 Academic Year Transfer Application</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm max-w-2xl overflow-hidden">
        {/* Top color bar */}
        <div className={`h-1.5 w-full ${isAccepted ? 'bg-green-500' : 'bg-red-500'}`} />

        <div className="p-8">
          {/* Result */}
          <div className="text-center py-6">
            <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center mx-auto mb-4 text-3xl font-bold ${
              isAccepted ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'
            }`}>
              {isAccepted ? '✓' : '✕'}
            </div>
            <h2 className={`text-4xl font-extrabold tracking-wide mb-2 ${isAccepted ? 'text-green-600' : 'text-red-600'}`}>
              {isAccepted ? 'ACCEPTED' : 'REJECTED'}
            </h2>
            <p className="text-sm text-gray-500">
              {isAccepted
                ? 'Congratulations! You have been placed in the Primary List (Asil).'
                : 'Your application has not been accepted.'}
            </p>
          </div>

          <hr className="border-gray-100 mb-6" />

          <h3 className="text-sm font-bold text-gray-700 mb-4">Placement Details</h3>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
              <span className="text-xl text-[#8b1a1a]">🏛</span>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Department</p>
                <p className="text-sm font-semibold text-gray-900">{app.targetDepartment ?? 'Computer Engineering'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
              <span className="text-xl text-[#8b1a1a]">📅</span>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Academic Term</p>
                <p className="text-sm font-semibold text-gray-900">{app.term.replace('-', '–')} {app.term.includes('FALL') ? 'Fall' : 'Spring'} Semester</p>
              </div>
            </div>
          </div>

          {!isAccepted && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-sm text-red-700">
              <strong>Rejection Reason:</strong> Your application did not meet the requirements. Please contact support for more information.
            </div>
          )}

          {isAccepted && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex gap-3">
              <span className="text-blue-500 shrink-0">ℹ</span>
              <div>
                <p className="text-xs font-semibold text-blue-800 mb-0.5">Important Registration Information</p>
                <p className="text-xs text-blue-700">Registration dates are between Sep 20–25. Please bring your original documents.</p>
              </div>
            </div>
          )}

          {docError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700">{docError}</div>
          )}

          {isAccepted && (
            <div className="space-y-3">
              <button
                onClick={() => void handleDownloadLetter()}
                className="w-full flex items-center justify-center gap-3 py-3 bg-[#8b1a1a] hover:bg-[#6b1414] text-white rounded-xl font-semibold text-sm transition"
              >
                <span>⬇</span>
                Download Acceptance Letter (PDF)
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Digitally Signed</span>
              </button>
              <button className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">
                🔍 Verify Document
              </button>
            </div>
          )}

          <p className="mt-6 text-center text-[10px] text-gray-300">
            Application ID: UTM-2025-{app.id} • Issued: {new Date(app.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
