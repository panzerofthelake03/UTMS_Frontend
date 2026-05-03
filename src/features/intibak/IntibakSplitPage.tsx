import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { adminApi, type AdminApplication, type CourseExemption } from '../../shared/api/adminApi';
import Spinner from '../../shared/components/Spinner';

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

const DECISION_COLORS: Record<string, string> = {
  EXEMPT: '#16a34a',
  PARTIAL: '#d97706',
  REJECTED: '#dc2626',
  PENDING: '#6b7280',
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
    <div>
      <button onClick={() => navigate(-1)} style={backBtn}>&#8592; Back to Queue</button>
      <h2 style={{ marginTop: 0, color: '#1d3c6e' }}>Intibak &mdash; Course Exemptions</h2>
      {app && (
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: -8, marginBottom: 16 }}>
          Application #{appId} &middot; {app.studentFirstName} {app.studentLastName} &middot; {app.studentEmail} &middot; {app.term}
        </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={panel}>
          <h3 style={panelTitle}>Add Course Mapping</h3>
          {addError && <div style={errBox}>{addError}</div>}
          <form onSubmit={addForm.handleSubmit(onAddExemption)} style={formCol}>
            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>Student Course</legend>
              <label style={labelStyle} htmlFor="studentCourseName">Name *</label>
              <input id="studentCourseName" style={inputStyle} {...addForm.register('studentCourseName', { required: true })} />
              <label style={labelStyle} htmlFor="studentCourseCode">Code *</label>
              <input id="studentCourseCode" style={inputStyle} {...addForm.register('studentCourseCode', { required: true })} />
              <label style={labelStyle} htmlFor="studentCourseCredits">Credits *</label>
              <input id="studentCourseCredits" type="number" style={inputStyle} {...addForm.register('studentCourseCredits', { required: true, min: 1 })} />
              <label style={labelStyle} htmlFor="studentCourseGrade">Grade</label>
              <input id="studentCourseGrade" style={inputStyle} {...addForm.register('studentCourseGrade')} />
            </fieldset>
            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>Target Curriculum Course</legend>
              <label style={labelStyle} htmlFor="targetCourseName">Name</label>
              <input id="targetCourseName" style={inputStyle} {...addForm.register('targetCourseName')} />
              <label style={labelStyle} htmlFor="targetCourseCode">Code</label>
              <input id="targetCourseCode" style={inputStyle} {...addForm.register('targetCourseCode')} />
              <label style={labelStyle} htmlFor="targetCourseCredits">Credits</label>
              <input id="targetCourseCredits" type="number" style={inputStyle} {...addForm.register('targetCourseCredits', { min: 1 })} />
            </fieldset>
            <button type="submit" disabled={addForm.formState.isSubmitting} style={primaryBtn}>Add Mapping</button>
          </form>
        </div>
        <div style={panel}>
          <h3 style={panelTitle}>Course Mappings ({exemptions.length})</h3>
          {exemptions.length === 0 && <p style={{ fontSize: 13, color: '#6b7280' }}>No course mappings yet.</p>}
          {exemptions.map((e) => (
            <div key={e.id} style={exemptionRow}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'start' }}>
                <div>
                  <div style={courseLabel}>Student</div>
                  <div style={courseCode}>{e.studentCourseCode}</div>
                  <div style={courseName}>{e.studentCourseName}</div>
                  <div style={courseMeta}>{e.studentCourseCredits} cr{e.studentCourseGrade ? ` / ${e.studentCourseGrade}` : ''}</div>
                </div>
                <div style={{ color: '#9ca3af', fontSize: 18, paddingTop: 18 }}>&#8594;</div>
                <div>
                  <div style={courseLabel}>Target</div>
                  {e.targetCourseCode
                    ? (<><div style={courseCode}>{e.targetCourseCode}</div><div style={courseName}>{e.targetCourseName}</div><div style={courseMeta}>{e.targetCourseCredits} cr</div></>)
                    : <div style={{ fontSize: 12, color: '#9ca3af' }}>Not mapped</div>}
                </div>
              </div>
              <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: DECISION_COLORS[e.decision ?? 'PENDING'] ?? '#6b7280' }}>
                  {e.decision ?? 'PENDING'}
                </span>
                {e.decisionNote && <span style={{ fontSize: 12, color: '#374151' }}>- {e.decisionNote}</span>}
                {e.decidedByEmail && <span style={{ fontSize: 11, color: '#9ca3af' }}>(by {e.decidedByEmail})</span>}
              </div>
              {(!e.decision || e.decision === 'PENDING') && (
                decidingId === e.id ? (
                  <form onSubmit={decideForm.handleSubmit((v) => onDecide(e.id, v))}
                    style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <select style={{ ...inputStyle, padding: '4px 8px', minWidth: 110 }} {...decideForm.register('decision', { required: true })}>
                      <option value="">Decision...</option>
                      <option value="EXEMPT">EXEMPT</option>
                      <option value="PARTIAL">PARTIAL</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                    <input placeholder="Note" style={{ ...inputStyle, padding: '4px 8px', flex: 1 }} {...decideForm.register('decisionNote')} />
                    <button type="submit" style={{ ...primaryBtn, padding: '5px 10px', fontSize: 12 }}>Save</button>
                    <button type="button" onClick={() => setDecidingId(null)} style={{ ...secondaryBtn, padding: '5px 10px', fontSize: 12 }}>Cancel</button>
                  </form>
                ) : (
                  <button onClick={() => { setDecidingId(e.id); decideForm.reset(); }} style={{ ...actionBtn, marginTop: 6 }}>Decide</button>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const backBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#1d3c6e', cursor: 'pointer', fontSize: 13, padding: '0 0 12px', fontWeight: 600 };
const panel: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px' };
const panelTitle: React.CSSProperties = { margin: '0 0 12px', fontSize: 15, color: '#1d3c6e' };
const formCol: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
const fieldsetStyle: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 12px', marginBottom: 8 };
const legendStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#6b7280', padding: '0 4px' };
const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, display: 'block', marginTop: 6 };
const inputStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14, width: '100%', boxSizing: 'border-box' as const };
const primaryBtn: React.CSSProperties = { padding: '8px 16px', background: '#1d3c6e', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' };
const secondaryBtn: React.CSSProperties = { padding: '8px 16px', background: 'none', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, fontWeight: 600, cursor: 'pointer' };
const actionBtn: React.CSSProperties = { background: 'none', border: '1px solid #1d3c6e', color: '#1d3c6e', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 };
const errBox: React.CSSProperties = { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4, padding: '7px 10px', fontSize: 13, color: '#b91c1c', marginBottom: 8 };
const exemptionRow: React.CSSProperties = { borderBottom: '1px solid #f3f4f6', paddingBottom: 12, marginBottom: 12 };
const courseLabel: React.CSSProperties = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, color: '#9ca3af', letterSpacing: '0.05em' };
const courseCode: React.CSSProperties = { fontWeight: 700, fontSize: 13, fontFamily: 'monospace', color: '#1d3c6e' };
const courseName: React.CSSProperties = { fontSize: 13, marginTop: 1 };
const courseMeta: React.CSSProperties = { fontSize: 11, color: '#6b7280', marginTop: 2 };
