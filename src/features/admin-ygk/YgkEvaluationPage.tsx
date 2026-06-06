import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { adminApi, type AdminApplication, type EvaluationResponse } from '../../shared/api/adminApi';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import Spinner from '../../shared/components/Spinner';

const PRIMARY = '#8b1a1a';

interface FormValues {
  gpaScore: number;
  languageScore: number;
  manualAdjustment: number;
  adjustmentReason: string;
  decision: string;
  evaluatorNote: string;
}

export default function YgkEvaluationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<AdminApplication | null>(null);
  const [existing, setExisting] = useState<EvaluationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: { manualAdjustment: 0 },
  });

  const appId = Number(id);

  useEffect(() => {
    Promise.all([
      adminApi.ygkList(),
      adminApi.ygkGetEvaluation(appId).catch(() => null),
    ]).then(([listRes, evalRes]) => {
      setApp(listRes.data.data.find((a) => a.id === appId) ?? null);
      setExisting(evalRes?.data.data ?? null);
    }).finally(() => setLoading(false));
  }, [appId]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await adminApi.ygkEvaluate(appId, values);
      navigate('/admin/ygk/applications');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setServerError(err.response?.data?.error?.message ?? 'Evaluation failed.');
    }
  }

  if (loading) return <div className="p-8"><Spinner /></div>;
  if (!app) return <div className="p-8 text-gray-500">Application not found.</div>;

  return (
    <div className="p-6 md:p-10 max-w-2xl">
      {/* Back */}
      <button
        onClick={() => navigate('/admin/ygk/applications')}
        className="flex items-center gap-1 text-sm font-semibold mb-5 hover:opacity-75 transition-opacity"
        style={{ color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Queue
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900 m-0">Application #{app.id}</h1>
        <ApplicationStatusBadge status={app.status} />
      </div>

      {/* Student info */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Student Information</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <InfoField label="Student" value={`${app.studentFirstName} ${app.studentLastName}`} />
          <InfoField label="Email" value={app.studentEmail} />
          <InfoField label="GPA" value={app.gpa != null ? String(app.gpa) : '—'} />
          <InfoField label="Term" value={app.term} />
          <InfoField label="Department" value={app.department ?? '—'} />
          <InfoField label="Faculty" value={app.faculty ?? '—'} />
        </div>
      </section>

      {/* Existing evaluation */}
      {existing && (
        <div className="mb-5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <strong>Existing evaluation:</strong> Composite score {existing.compositeScore} — {existing.decision}
        </div>
      )}

      {/* Evaluation form */}
      {app.status === 'UNDER_YGK_REVIEW' && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 m-0">Submit Evaluation</h2>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col gap-4">
            {serverError && (
              <div className="px-3 py-2 text-sm rounded-lg bg-red-50 border border-red-200 text-red-700">
                {serverError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="gpaScore">
                  GPA Score (0–100)
                </label>
                <input
                  id="gpaScore"
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30"
                  {...register('gpaScore', { required: 'Required', min: 0, max: 100, valueAsNumber: true })}
                />
                {errors.gpaScore && <span className="text-xs text-red-500 mt-0.5">{errors.gpaScore.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="languageScore">
                  Language Score (0–100)
                </label>
                <input
                  id="languageScore"
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30"
                  {...register('languageScore', { required: 'Required', min: 0, max: 100, valueAsNumber: true })}
                />
                {errors.languageScore && <span className="text-xs text-red-500 mt-0.5">{errors.languageScore.message}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="manualAdjustment">
                  Manual Adjustment (−5 to +5)
                </label>
                <input
                  id="manualAdjustment"
                  type="number"
                  step="0.5"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30"
                  {...register('manualAdjustment', { min: -5, max: 5, valueAsNumber: true })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="adjustmentReason">
                  Adjustment Reason
                </label>
                <input
                  id="adjustmentReason"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30"
                  {...register('adjustmentReason')}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="decision">
                Decision <span className="text-red-500">*</span>
              </label>
              <select
                id="decision"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 bg-white"
                {...register('decision', { required: 'Required' })}
              >
                <option value="">Select…</option>
                <option value="ACCEPTED">ACCEPTED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
              {errors.decision && <span className="text-xs text-red-500 mt-0.5">{errors.decision.message}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="evaluatorNote">
                Evaluator Note
              </label>
              <textarea
                id="evaluatorNote"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 resize-none"
                style={{ fontFamily: 'inherit' }}
                {...register('evaluatorNote')}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="self-start flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-opacity disabled:opacity-50"
              style={{ background: PRIMARY }}
            >
              {isSubmitting ? 'Submitting…' : 'Submit Evaluation'}
            </button>
          </form>
        </section>
      )}

      {app.status !== 'UNDER_YGK_REVIEW' && (
        <div className="mt-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
          This application is not in UNDER_YGK_REVIEW status and cannot be evaluated at this time.
        </div>
      )}
    </div>
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
