import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { adminApi, type AdminApplication, type CourseExemption } from '../../shared/api/adminApi';
import Spinner from '../../shared/components/Spinner';

const PRIMARY = '#8b1a1a';

interface AddForm {
  studentCourseName: string;
  studentCourseCode: string;
  studentCourseCredits: number;
  studentCourseGrade?: string;
  targetCourseName?: string;
  targetCourseCode?: string;
  targetCourseCredits?: number;
}
interface DecideForm { decision: string; decisionNote: string }

const DECISION_CFG: Record<string, { bg: string; text: string }> = {
  EXEMPT:   { bg: 'bg-green-50',  text: 'text-green-700'  },
  PARTIAL:  { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  REJECTED: { bg: 'bg-red-50',    text: 'text-red-700'    },
  PENDING:  { bg: 'bg-gray-100',  text: 'text-gray-500'   },
};

export default function IntibakSplitPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const appId = Number(id);
  const [app, setApp] = useState<AdminApplication | null>(null);
  const [exemptions, setExemptions] = useState<CourseExemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [addError, setAddError] = useState<string | null>(null);
  const addForm = useForm<AddForm>();
  const decideForm = useForm<DecideForm>();
  const [decidingId, setDecidingId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      adminApi.intibakQueueList(),
      adminApi.intibakListExemptions(appId),
    ]).then(([listRes, exRes]) => {
      setApp(listRes.data.data.find((a) => a.id === appId) ?? null);
      setExemptions(exRes.data.data);
    }).finally(() => setLoading(false));
  }, [appId]);

  async function onAddExemption(values: AddForm) {
    setAddError(null);
    try {
      const res = await adminApi.intibakCreateExemption(appId, {
        studentCourseCode: values.studentCourseCode,
        studentCourseName: values.studentCourseName,
        studentCourseCredits: Number(values.studentCourseCredits),
        studentCourseGrade: values.studentCourseGrade || undefined,
        targetCourseCode: values.targetCourseCode || undefined,
        targetCourseName: values.targetCourseName || undefined,
        targetCourseCredits: values.targetCourseCredits ? Number(values.targetCourseCredits) : undefined,
      });
      setExemptions((prev) => [...prev, res.data.data]);
      addForm.reset();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setAddError(err.response?.data?.error?.message ?? 'Failed to add course mapping.');
    }
  }

  async function onDecide(exemptionId: number, values: DecideForm) {
    try {
      const res = await adminApi.intibakDecideExemption(appId, exemptionId, {
        decision: values.decision,
        decisionNote: values.decisionNote || undefined,
      });
      setExemptions((prev) => prev.map((e) => (e.id === exemptionId ? res.data.data : e)));
      setDecidingId(null);
      decideForm.reset();
    } catch { /* ignore */ }
  }

  if (loading) return <Spinner />;

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm font-semibold mb-5 hover:opacity-75 transition-opacity"
        style={{ color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Queue
      </button>

      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Intibak — Course Exemptions</h1>
      {app && (
        <p className="text-sm text-gray-500 mb-6">
          Application #{appId} · {app.studentFirstName} {app.studentLastName} · {app.studentEmail} · {app.term}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Add Mapping Panel ─── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 m-0">Add Course Mapping</h2>
          </div>
          <div className="p-5">
            {addError && (
              <div className="mb-4 px-3 py-2 text-sm rounded-lg bg-red-50 border border-red-200 text-red-700">
                {addError}
              </div>
            )}
            <form onSubmit={addForm.handleSubmit(onAddExemption)} className="flex flex-col gap-4">
              {/* Student Course */}
              <fieldset className="border border-gray-200 rounded-xl p-4">
                <legend className="text-xs font-bold text-gray-400 uppercase tracking-wide px-1">Student Course</legend>
                <div className="flex flex-col gap-3 mt-1">
                  <FormField label="Name" required>
                    <input
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200"
                      {...addForm.register('studentCourseName', { required: true })}
                    />
                  </FormField>
                  <FormField label="Code" required>
                    <input
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 font-mono"
                      {...addForm.register('studentCourseCode', { required: true })}
                    />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Credits" required>
                      <input
                        type="number"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200"
                        {...addForm.register('studentCourseCredits', { required: true, min: 1 })}
                      />
                    </FormField>
                    <FormField label="Grade">
                      <input
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200"
                        placeholder="e.g. AA"
                        {...addForm.register('studentCourseGrade')}
                      />
                    </FormField>
                  </div>
                </div>
              </fieldset>

              {/* Target Course */}
              <fieldset className="border border-gray-200 rounded-xl p-4">
                <legend className="text-xs font-bold text-gray-400 uppercase tracking-wide px-1">Target Curriculum Course</legend>
                <div className="flex flex-col gap-3 mt-1">
                  <FormField label="Name">
                    <input
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200"
                      {...addForm.register('targetCourseName')}
                    />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Code">
                      <input
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 font-mono"
                        {...addForm.register('targetCourseCode')}
                      />
                    </FormField>
                    <FormField label="Credits">
                      <input
                        type="number"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200"
                        {...addForm.register('targetCourseCredits', { min: 1 })}
                      />
                    </FormField>
                  </div>
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={addForm.formState.isSubmitting}
                className="self-start px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-opacity disabled:opacity-50"
                style={{ background: PRIMARY }}
              >
                {addForm.formState.isSubmitting ? 'Adding…' : 'Add Mapping'}
              </button>
            </form>
          </div>
        </div>

        {/* ─── Mappings List Panel ─── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 m-0">
              Course Mappings ({exemptions.length})
            </h2>
          </div>
          <div className="p-5">
            {exemptions.length === 0 ? (
              <p className="text-sm text-gray-400">No course mappings yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {exemptions.map((e) => {
                  const cfg = DECISION_CFG[e.decision ?? 'PENDING'] ?? DECISION_CFG['PENDING'];
                  return (
                    <div key={e.id} className="border border-gray-100 rounded-xl p-4">
                      {/* Course mapping row */}
                      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start mb-3">
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Student</div>
                          <div className="font-mono text-xs font-bold text-gray-700">{e.studentCourseCode}</div>
                          <div className="text-sm text-gray-800 mt-0.5">{e.studentCourseName}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {e.studentCourseCredits} cr{e.studentCourseGrade ? ` / ${e.studentCourseGrade}` : ''}
                          </div>
                        </div>
                        <div className="text-gray-300 text-lg pt-5">→</div>
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Target</div>
                          {e.targetCourseCode ? (
                            <>
                              <div className="font-mono text-xs font-bold text-gray-700">{e.targetCourseCode}</div>
                              <div className="text-sm text-gray-800 mt-0.5">{e.targetCourseName}</div>
                              <div className="text-xs text-gray-400 mt-0.5">{e.targetCourseCredits} cr</div>
                            </>
                          ) : (
                            <div className="text-xs text-gray-400 italic">Not mapped</div>
                          )}
                        </div>
                      </div>

                      {/* Decision badge + note */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${cfg.bg} ${cfg.text}`}>
                          {e.decision ?? 'PENDING'}
                        </span>
                        {e.decisionNote && (
                          <span className="text-xs text-gray-600">— {e.decisionNote}</span>
                        )}
                        {e.decidedByEmail && (
                          <span className="text-xs text-gray-400">(by {e.decidedByEmail})</span>
                        )}
                      </div>

                      {/* Decide inline form */}
                      {(!e.decision || e.decision === 'PENDING') && (
                        decidingId === e.id ? (
                          <form
                            onSubmit={decideForm.handleSubmit((v) => onDecide(e.id, v))}
                            className="flex flex-wrap gap-2 items-center mt-2"
                          >
                            <select
                              className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none"
                              {...decideForm.register('decision', { required: true })}
                            >
                              <option value="">Decision…</option>
                              <option value="EXEMPT">EXEMPT</option>
                              <option value="PARTIAL">PARTIAL</option>
                              <option value="REJECTED">REJECTED</option>
                            </select>
                            <input
                              placeholder="Note (optional)"
                              className="flex-1 min-w-[100px] px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none"
                              {...decideForm.register('decisionNote')}
                            />
                            <button
                              type="submit"
                              className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg"
                              style={{ background: PRIMARY }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setDecidingId(null)}
                              className="px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <button
                            onClick={() => { setDecidingId(e.id); decideForm.reset(); }}
                            className="mt-1 px-3 py-1 text-xs font-semibold rounded-lg border transition-colors hover:bg-gray-50"
                            style={{ borderColor: PRIMARY, color: PRIMARY }}
                          >
                            Decide
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
