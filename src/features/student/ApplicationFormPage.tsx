import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationApi } from '../../shared/api/applicationApi';
import { integrationApi } from '../../shared/api/integrationApi';
import DocumentUpload from './components/DocumentUpload';
import type { Document } from '../../shared/api/applicationApi';

const PRIMARY = '#8b1a1a';

const TARGET_DEPARTMENTS = [
  'Computer Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Industrial Engineering',
  'Architecture',
  'International Relations',
  'Business Administration',
  'Economics',
];

const TERMS = ['2025-FALL', '2026-SPRING', '2026-FALL', '2027-SPRING'];

interface AcademicInfo {
  gpa: string;
  disciplinaryRecord: string;
  transcriptStatus: string;
}

export default function ApplicationFormPage() {
  const navigate = useNavigate();

  // Academic info (auto-filled from UBYS)
  const [academic, setAcademic] = useState<AcademicInfo | null>(null);
  const [academicLoading, setAcademicLoading] = useState(true);

  // Form state
  const [term, setTerm] = useState('');
  const [targetDept, setTargetDept] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [hasProficiencyDoc, setHasProficiencyDoc] = useState<boolean>(true);
  const [confirmed, setConfirmed] = useState(false);

  // Application draft (created early so document upload can reference it)
  const [draftId, setDraftId] = useState<number | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Document[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // UC 1.6 step 3: auto-fill from UBYS
  useEffect(() => {
    integrationApi.ubysAutofill()
      .then((res) => {
        const d = res.data; // IntegrationController returns directly, no ApiResponse wrapper
        setAcademic({
          gpa: d.gpa != null && d.gpa > 0 ? Number(d.gpa).toFixed(2) : '—',
          disciplinaryRecord: 'Clean',
          transcriptStatus: 'Available',
        });
      })
      .catch(() => {
        // Fall back to placeholder so the form is still usable
        setAcademic({ gpa: '—', disciplinaryRecord: 'Clean', transcriptStatus: 'Pending' });
      })
      .finally(() => setAcademicLoading(false));
  }, []);

  // Create draft on mount so document upload has an applicationId
  useEffect(() => {
    applicationApi.create({ term: 'DRAFT', englishProficiencyOption: 'DOCUMENT' })
      .then((res) => setDraftId(res.data.data.id))
      .catch(() => { /* will retry on submit */ });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!term) { setServerError('Please select a term.'); return; }
    if (!targetDept) { setServerError('Please select a target department.'); return; }
    if (!phone.trim()) { setServerError('Phone number is required.'); return; }
    if (!address.trim()) { setServerError('Address is required.'); return; }
    if (!confirmed) { setServerError('Please confirm that your GPA and Transcript data are correct.'); return; }
    if (hasProficiencyDoc && uploadedDocs.length === 0) {
      setServerError('Please upload your English Proficiency Document or select "No / I will take the exam".');
      return;
    }

    setSubmitting(true);
    try {
      let appId = draftId;
      if (appId) {
        // Update existing draft with all fields
        await applicationApi.update(appId, {
          term,
          targetDepartment: targetDept,
          phone,
          address,
          englishProficiencyOption: hasProficiencyDoc ? 'DOCUMENT' : 'YDYO_EXAM',
        });
      } else {
        // Create fresh if draft creation failed earlier
        const res = await applicationApi.create({
          term,
          targetDepartment: targetDept,
          phone,
          address,
          englishProficiencyOption: hasProficiencyDoc ? 'DOCUMENT' : 'YDYO_EXAM',
        });
        appId = res.data.data.id;
      }
      // Submit the application
      await applicationApi.submit(appId!);
      navigate(`/student/applications/${appId}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setServerError(err.response?.data?.error?.message ?? 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <h2 style={s.pageTitle}>Application Submission &amp; Document Upload</h2>
      <p style={s.pageSubtitle}>Complete your transfer application by filling in the required information below.</p>

      {serverError && <div style={s.errorBox}>{serverError}</div>}

      {/* Academic Information (Read-only) */}
      <section style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={s.cardTitle}>Academic Information</h3>
          <span style={s.readOnlyBadge}>🔒 Read-only</span>
        </div>
        {academicLoading ? (
          <p style={{ color: '#6b7280', fontSize: 13 }}>Loading academic records…</p>
        ) : academic ? (
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <AcademicField label="Current GPA" value={academic.gpa} />
            <AcademicField label="Disciplinary Record" value={academic.disciplinaryRecord} />
            <AcademicField label="Transcript Status" value={academic.transcriptStatus} />
          </div>
        ) : null}
      </section>

      <form onSubmit={handleSubmit}>
        {/* Contact Information */}
        <section style={s.card}>
          <h3 style={s.cardTitle}>Contact Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={s.label}>Mobile Phone *</label>
              <input
                type="tel"
                style={s.input}
                placeholder="+90 (XXX) XXX-XX-XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label style={s.label}>Correspondence Address *</label>
              <input
                type="text"
                style={s.input}
                placeholder="Enter your full address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Application Details */}
        <section style={s.card}>
          <h3 style={s.cardTitle}>Application Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={s.label}>Term *</label>
              <select style={s.input} value={term} onChange={(e) => setTerm(e.target.value)}>
                <option value="">Select term…</option>
                {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Target Department *</label>
              <select style={s.input} value={targetDept} onChange={(e) => setTargetDept(e.target.value)}>
                <option value="">Select department…</option>
                {TARGET_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* English Proficiency */}
        <section style={s.card}>
          <h3 style={s.cardTitle}>English Proficiency</h3>
          <p style={s.fieldLabel}>Do you have a valid English Proficiency Document? *</p>
          <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
              <input type="radio" checked={hasProficiencyDoc} onChange={() => setHasProficiencyDoc(true)} />
              Yes
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
              <input type="radio" checked={!hasProficiencyDoc} onChange={() => setHasProficiencyDoc(false)} />
              No / I will take the exam
            </label>
          </div>

          {!hasProficiencyDoc && (
            <div style={s.warningBox}>
              ⚠ You will be required to take the YDYO Exam.
            </div>
          )}

          {hasProficiencyDoc && draftId && (
            <DocumentUpload
              applicationId={draftId}
              lockedDocumentType="ENGLISH_PROFICIENCY"
              onUploaded={(doc) => setUploadedDocs((prev) => [...prev, doc])}
            />
          )}

          {hasProficiencyDoc && uploadedDocs.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
              ✓ {uploadedDocs[0].originalFilename} uploaded
            </div>
          )}
        </section>

        {/* Confirmation */}
        <section style={{ ...s.card, background: '#fffbeb', borderColor: '#fde68a' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 14, color: '#92400e' }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ marginTop: 2 }}
            />
            I confirm that my GPA and Transcript data are correct.
          </label>
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="submit" disabled={submitting} style={s.submitBtn}>
            {submitting ? 'Submitting…' : '✈ Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AcademicField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontWeight: 600, fontSize: 13 }}>
        <span>✓</span>
        <span style={{ color: '#374151', fontWeight: 400 }}>{label}</span>
      </div>
      <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', paddingLeft: 18 }}>{value}</span>
    </div>
  );
}

const s = {
  pageTitle: { fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px' } as React.CSSProperties,
  pageSubtitle: { fontSize: 13, color: '#6b7280', margin: '0 0 24px' } as React.CSSProperties,
  card: {
    background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb',
    padding: '20px 24px', marginBottom: 20,
  } as React.CSSProperties,
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 4px' } as React.CSSProperties,
  readOnlyBadge: { fontSize: 12, color: '#6b7280', background: '#f3f4f6', padding: '3px 10px', borderRadius: 12 } as React.CSSProperties,
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 } as React.CSSProperties,
  fieldLabel: { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 } as React.CSSProperties,
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6,
    fontSize: 14, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box',
  } as React.CSSProperties,
  warningBox: {
    background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6,
    padding: '10px 14px', fontSize: 13, color: '#92400e', marginBottom: 12,
  } as React.CSSProperties,
  errorBox: {
    background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6,
    padding: '10px 14px', fontSize: 13, color: '#b91c1c', marginBottom: 16,
  } as React.CSSProperties,
  submitBtn: {
    padding: '12px 32px', background: PRIMARY, color: '#fff', border: 'none',
    borderRadius: 6, fontSize: 15, fontWeight: 700, cursor: 'pointer',
  } as React.CSSProperties,
};
