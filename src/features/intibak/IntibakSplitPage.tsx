import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi, type AdminApplication } from '../../shared/api/adminApi';
import Spinner from '../../shared/components/Spinner';

const PRIMARY = '#8b1a1a';

interface TargetCourse { code: string; name: string; ects: number }
interface TranscriptCourse { code: string; name: string; ects: number; grade: string; semester: string }
interface Mapping { sourceCode: string | null; status: 'PENDING' | 'EQUIVALENT' | 'NOT_EQUIVALENT'; existingId?: number }

// ---------- Mock curriculum (IYTE Computer Engineering) ----------
const IYTE_CURRICULUM: TargetCourse[] = [
  { code: 'CS 101',   name: 'Introduction to Programming',    ects: 6 },
  { code: 'CS 102',   name: 'Data Structures',               ects: 5 },
  { code: 'MATH 101', name: 'Calculus I',                    ects: 7 },
  { code: 'PHYS 101', name: 'Physics I',                     ects: 5 },
  { code: 'CS 201',   name: 'Object-Oriented Programming',   ects: 8 },
  { code: 'EE 101',   name: 'Circuit Theory',                ects: 4 },
  { code: 'CS 301',   name: 'Algorithms',                    ects: 6 },
  { code: 'MATH 201', name: 'Linear Algebra',                ects: 5 },
];

// ---------- Mock student transcript (demo data) ----------
const MOCK_TRANSCRIPT: TranscriptCourse[] = [
  { code: 'DES 101',  name: 'Design Fundamentals',       ects: 6, grade: 'AA', semester: 'Fall 2022' },
  { code: 'ENG 102',  name: 'Engineering Drawing',       ects: 5, grade: 'BA', semester: 'Fall 2022' },
  { code: 'PHY 101',  name: 'Physics I',                 ects: 5, grade: 'BB', semester: 'Fall 2022' },
  { code: 'MATH 101', name: 'Calculus',                  ects: 7, grade: 'CB', semester: 'Fall 2022' },
  { code: 'CS 101',   name: 'Intro to Programming',      ects: 6, grade: 'AA', semester: 'Spring 2023' },
  { code: 'DS 201',   name: 'Data Structures',           ects: 5, grade: 'BA', semester: 'Spring 2023' },
  { code: 'MATH 201', name: 'Linear Algebra',            ects: 5, grade: 'AA', semester: 'Spring 2023' },
  { code: 'CS 201',   name: 'OOP Programming',           ects: 8, grade: 'AA', semester: 'Spring 2023' },
  { code: 'ALG 301',  name: 'Algorithm Analysis',        ects: 6, grade: 'BA', semester: 'Fall 2023' },
  { code: 'EE 102',   name: 'Circuit Theory',            ects: 4, grade: 'BB', semester: 'Fall 2023' },
];

function groupBySemester(courses: TranscriptCourse[]): [string, TranscriptCourse[]][] {
  const map = new Map<string, TranscriptCourse[]>();
  for (const c of courses) {
    if (!map.has(c.semester)) map.set(c.semester, []);
    map.get(c.semester)!.push(c);
  }
  return [...map.entries()];
}

export default function IntibakSplitPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const appId = Number(id);

  const [app, setApp] = useState<AdminApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [mappings, setMappings] = useState<Record<string, Mapping>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminApi.intibakQueueList().catch(() => ({ data: { data: [] as AdminApplication[] } })),
      adminApi.ygkList().catch(() => ({ data: { data: [] as AdminApplication[] } })),
      adminApi.intibakListExemptions(appId).catch(() => ({ data: { data: [] } })),
    ]).then(([intibakRes, ygkRes, exRes]) => {
      const found =
        (intibakRes.data.data as AdminApplication[]).find((a) => a.id === appId) ??
        (ygkRes.data.data as AdminApplication[]).find((a) => a.id === appId) ??
        null;
      setApp(found);

      // Initialize all mappings as empty
      const init: Record<string, Mapping> = {};
      for (const tc of IYTE_CURRICULUM) {
        init[tc.code] = { sourceCode: null, status: 'PENDING' };
      }
      // Pre-fill from existing exemptions
      for (const ex of exRes.data.data as import('../../shared/api/adminApi').CourseExemption[]) {
        if (ex.targetCourseCode && init[ex.targetCourseCode]) {
          init[ex.targetCourseCode] = {
            sourceCode: ex.studentCourseCode,
            status: ex.decision === 'EXEMPT' ? 'EQUIVALENT'
                  : ex.decision === 'REJECTED' ? 'NOT_EQUIVALENT'
                  : 'PENDING',
            existingId: ex.id,
          };
        }
      }
      setMappings(init);
    }).finally(() => setLoading(false));
  }, [appId]);

  function patch(targetCode: string, p: Partial<Mapping>) {
    setMappings((prev) => ({ ...prev, [targetCode]: { ...prev[targetCode], ...p } }));
  }

  function handleSelect(targetCode: string, sourceCode: string) {
    patch(targetCode, { sourceCode: sourceCode || null, status: 'PENDING' });
  }

  function toggleEquivalent(targetCode: string) {
    const m = mappings[targetCode];
    if (!m.sourceCode) return;
    patch(targetCode, { status: m.status === 'EQUIVALENT' ? 'PENDING' : 'EQUIVALENT' });
  }

  const equivalentEntries = Object.entries(mappings).filter(([, m]) => m.status === 'EQUIVALENT');
  const totalExemptedCredits = equivalentEntries.reduce((s, [code]) => {
    return s + (IYTE_CURRICULUM.find((c) => c.code === code)?.ects ?? 0);
  }, 0);
  const totalEcts = IYTE_CURRICULUM.reduce((s, c) => s + c.ects, 0);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      for (const [targetCode, mapping] of Object.entries(mappings)) {
        if (!mapping.sourceCode) continue;
        const tc = IYTE_CURRICULUM.find((c) => c.code === targetCode);
        const sc = MOCK_TRANSCRIPT.find((c) => c.code === mapping.sourceCode);
        if (!tc || !sc) continue;

        let exemptionId = mapping.existingId;
        if (!exemptionId) {
          const res = await adminApi.intibakCreateExemption(appId, {
            studentCourseCode: sc.code,
            studentCourseName: sc.name,
            studentCourseCredits: sc.ects,
            studentCourseGrade: sc.grade,
            targetCourseCode: tc.code,
            targetCourseName: tc.name,
            targetCourseCredits: tc.ects,
          });
          exemptionId = res.data.data.id;
        }

        if (mapping.status === 'EQUIVALENT') {
          await adminApi.intibakDecideExemption(appId, exemptionId, {
            decision: 'EXEMPT',
            decisionNote: 'Equivalent course — verified by YGK',
          });
        } else if (mapping.status === 'NOT_EQUIVALENT') {
          await adminApi.intibakDecideExemption(appId, exemptionId, {
            decision: 'REJECTED',
            decisionNote: 'Not equivalent',
          });
        }
      }
      navigate(-1);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setSaveError(err.response?.data?.error?.message ?? 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  const studentName = app ? `${app.studentFirstName} ${app.studentLastName}` : 'Demo Student';
  const dept = app?.department ?? 'Computer Engineering';
  const transcriptGroups = groupBySemester(MOCK_TRANSCRIPT);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Breadcrumb + Title ── */}
      <div style={{ padding: '14px 24px 12px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
          <button onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0, fontSize: 12 }}>
            Student Review
          </button>
          <span style={{ margin: '0 5px', color: '#d1d5db' }}>›</span>
          <span style={{ color: '#374151', fontWeight: 600 }}>Prepare Credit Transfer</span>
        </div>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111' }}>
          Credit Transfer Worksheet: {studentName} &mdash; {dept}
        </h2>
      </div>

      {/* ── Split content ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ════ LEFT: Curriculum Matching ════ */}
        <div style={{ flex: '0 0 62%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#111' }}>Curriculum Matching</h3>
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <colgroup>
                <col style={{ width: '34%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '35%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '12%' }} />
              </colgroup>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr style={{ background: '#f9fafb' }}>
                  {['Target Course (Our Curriculum)', 'Target ECTS', 'Equivalent Source Course', 'Source Grade', 'Status'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {IYTE_CURRICULUM.map((tc) => {
                  const m = mappings[tc.code] ?? { sourceCode: null, status: 'PENDING' };
                  const sc = MOCK_TRANSCRIPT.find((c) => c.code === m.sourceCode);
                  return (
                    <tr key={tc.code} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      {/* Target course */}
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: '#374151' }}>{tc.code}</span>
                        <span style={{ color: '#6b7280', marginLeft: 6 }}>– {tc.name}</span>
                      </td>
                      {/* Target ECTS */}
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: '#374151' }}>
                        {tc.ects}
                      </td>
                      {/* Source course dropdown */}
                      <td style={tdStyle}>
                        <select
                          value={m.sourceCode ?? ''}
                          onChange={(e) => handleSelect(tc.code, e.target.value)}
                          style={selectStyle}
                        >
                          <option value="">Select course from transcript...</option>
                          {MOCK_TRANSCRIPT.map((sc) => (
                            <option key={sc.code} value={sc.code}>
                              {sc.code} – {sc.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      {/* Source grade */}
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#111' }}>
                        {sc?.grade ?? <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>
                      {/* Status badge / toggle */}
                      <td style={tdStyle}>
                        {m.sourceCode ? (
                          <button onClick={() => toggleEquivalent(tc.code)} style={m.status === 'EQUIVALENT' ? badgeEquivalent : badgePending}>
                            {m.status === 'EQUIVALENT' ? 'Equivalent' : 'Pending'}
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: '#e5e7eb' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Bottom bar ── */}
          <div style={{ flexShrink: 0, borderTop: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
            <div style={{ fontSize: 13, color: '#374151' }}>
              <strong>Total Exempted Credits: {totalExemptedCredits}</strong>
              <span style={{ margin: '0 14px', color: '#d1d5db' }}>|</span>
              <strong>Total ECTS: {totalEcts}</strong>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {saveError && (
                <span style={{ fontSize: 12, color: '#dc2626', maxWidth: 220 }}>{saveError}</span>
              )}
              <button onClick={() => navigate(-1)} style={cancelBtn}>Cancel</button>
              <button onClick={() => void handleSave()} disabled={saving} style={saveBtn}>
                {saving ? 'Saving…' : 'Save & Finalize'}
              </button>
            </div>
          </div>
        </div>

        {/* ════ RIGHT: Student Transcript ════ */}
        <div style={{ flex: '0 0 38%', overflowY: 'auto', background: '#f9fafb', padding: '16px 18px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#111' }}>Student Transcript</h3>

          {/* University header */}
          <div style={transcriptCard}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#111', textAlign: 'center', letterSpacing: '0.03em' }}>
              ANKARA UNIVERSITY
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', textAlign: 'center', marginTop: 2 }}>Faculty of Engineering</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textAlign: 'center', marginTop: 2, letterSpacing: '0.05em' }}>
              OFFICIAL TRANSCRIPT
            </div>
          </div>

          {/* Student info */}
          <div style={{ ...transcriptCard, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: 12 }}>
            {[
              ['Student Name', studentName],
              ['Student No',   app?.studentNumber ?? 'S20260001'],
              ['Program',      dept],
            ].map(([label, val]) => (
              <>
                <span key={label + 'l'} style={{ color: '#9ca3af' }}>{label}</span>
                <span key={label + 'v'} style={{ fontWeight: 600, color: '#111' }}>{val}</span>
              </>
            ))}
          </div>

          {/* Courses by semester */}
          {transcriptGroups.map(([semester, courses]) => {
            const semEcts = courses.reduce((s, c) => s + c.ects, 0);
            return (
              <div key={semester} style={transcriptCard}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#111', marginBottom: 8 }}>{semester}</div>
                {courses.map((c) => (
                  <div key={c.code} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: 12 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#374151', fontSize: 11 }}>{c.code}</span>
                      <span style={{ color: '#6b7280', marginLeft: 5 }}>{c.name}</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>{c.ects} ECTS</span>
                    <span style={{ fontWeight: 700, fontSize: 12, color: '#111', minWidth: 22, textAlign: 'right' }}>{c.grade}</span>
                  </div>
                ))}
                <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af', textAlign: 'right', fontStyle: 'italic' }}>
                  Semester ECTS: {semEcts}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Styles ── */
const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 600,
  color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em',
  borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = { padding: '9px 12px', verticalAlign: 'middle' };
const selectStyle: React.CSSProperties = {
  width: '100%', padding: '5px 8px', border: '1px solid #d1d5db',
  borderRadius: 5, fontSize: 12, background: '#fff', color: '#374151', cursor: 'pointer',
};
const badgeEquivalent: React.CSSProperties = {
  padding: '3px 10px', borderRadius: 12, border: 'none', cursor: 'pointer',
  fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#15803d',
};
const badgePending: React.CSSProperties = {
  padding: '3px 10px', borderRadius: 12, border: 'none', cursor: 'pointer',
  fontSize: 11, fontWeight: 700, background: '#f3f4f6', color: '#6b7280',
};
const cancelBtn: React.CSSProperties = {
  padding: '7px 18px', border: '1px solid #d1d5db', borderRadius: 6,
  background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const saveBtn: React.CSSProperties = {
  padding: '7px 18px', border: 'none', borderRadius: 6,
  background: PRIMARY, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
};
const transcriptCard: React.CSSProperties = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
  padding: '12px 14px', marginBottom: 10,
};
