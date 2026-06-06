import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationApi } from '../../shared/api/applicationApi';
import { integrationApi } from '../../shared/api/integrationApi';
import DocumentUpload from './components/DocumentUpload';
import type { Document } from '../../shared/api/applicationApi';

const OTHER_DOCUMENT_TYPES = [
  { value: 'OSYM_PUAN',        label: 'ÖSYM Puan Belgesi',         required: true },
  { value: 'OGRENCI_BELGESI',  label: 'Öğrenci Belgesi',           required: true },
  { value: 'DERS_KATALOG',     label: 'Ders Kataloğu',             required: true },
  { value: 'IDENTITY',         label: 'Kimlik Belgesi',            required: true },
  { value: 'TRANSCRIPT',       label: 'Transkript',                required: true },
  { value: 'OSYM_YERLESTIRME', label: 'ÖSYM Yerleştirme Belgesi', required: false },
  { value: 'INTIBAK',          label: 'İntibak Belgesi',           required: false },
];

const TARGET_DEPARTMENTS = [
  'Computer Engineering', 'Electrical & Electronics Engineering',
  'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering',
  'Industrial Engineering', 'Architecture', 'International Relations',
  'Business Administration', 'Economics',
];
const TERMS = ['2025-FALL', '2026-SPRING', '2026-FALL', '2027-SPRING'];

interface AcademicInfo { gpa: string; disciplinaryRecord: string; transcriptStatus: string }

export default function ApplicationFormPage() {
  const navigate = useNavigate();
  const [academic, setAcademic] = useState<AcademicInfo | null>(null);
  const [academicLoading, setAcademicLoading] = useState(true);
  const [term, setTerm] = useState('');
  const [targetDept, setTargetDept] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [hasProficiencyDoc, setHasProficiencyDoc] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Document[]>([]);
  const [otherDocs, setOtherDocs] = useState<Record<string, Document>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    integrationApi.ubysAutofill()
      .then((res) => {
        const d = res.data;
        setAcademic({
          gpa: d.gpa != null && d.gpa > 0 ? Number(d.gpa).toFixed(2) : '—',
          disciplinaryRecord: 'Clean',
          transcriptStatus: 'Available',
        });
      })
      .catch(() => setAcademic({ gpa: '—', disciplinaryRecord: 'Clean', transcriptStatus: 'Pending' }))
      .finally(() => setAcademicLoading(false));
  }, []);

  useEffect(() => {
    applicationApi.create({ term: 'DRAFT', englishProficiencyOption: 'DOCUMENT' })
      .then((res) => setDraftId(res.data.data.id))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setServerError(null);
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
        await applicationApi.update(appId, { term, targetDepartment: targetDept, phone, address, englishProficiencyOption: hasProficiencyDoc ? 'DOCUMENT' : 'YDYO_EXAM' });
      } else {
        const res = await applicationApi.create({ term, targetDepartment: targetDept, phone, address, englishProficiencyOption: hasProficiencyDoc ? 'DOCUMENT' : 'YDYO_EXAM' });
        appId = res.data.data.id;
      }
      await applicationApi.submit(appId!);
      navigate(`/student/applications/${appId}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setServerError(err.response?.data?.error?.message ?? 'Failed to submit application.');
    } finally { setSubmitting(false); }
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Application Submission &amp; Document Upload</h1>
      <p className="text-sm text-gray-500 mb-6">Complete your transfer application by filling in the required information below.</p>

      {serverError && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{serverError}</div>
      )}

      {/* Academic Information */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-sm">Academic Information</h3>
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">🔒 Read-only</span>
        </div>
        {academicLoading ? (
          <p className="text-sm text-gray-400">Loading academic records…</p>
        ) : academic ? (
          <div className="flex flex-wrap gap-8">
            {[
              { label: 'Current GPA', value: academic.gpa },
              { label: 'Disciplinary Record', value: academic.disciplinaryRecord },
              { label: 'Transcript Status', value: academic.transcriptStatus },
            ].map((f) => (
              <div key={f.label} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-green-600 text-xs font-semibold">
                  <span>✓</span><span className="text-gray-500 font-normal">{f.label}</span>
                </div>
                <span className="text-xl font-bold text-gray-900 pl-4">{f.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Contact Information */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Phone *</label>
              <input type="tel" placeholder="+90 (XXX) XXX-XX-XX"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/20 focus:border-[#8b1a1a] transition"
                value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correspondence Address *</label>
              <input type="text" placeholder="Enter your full address"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/20 focus:border-[#8b1a1a] transition"
                value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Application Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Application Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Term *</label>
              <select className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/20 focus:border-[#8b1a1a] transition"
                value={term} onChange={(e) => setTerm(e.target.value)}>
                <option value="">Select term…</option>
                {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Department *</label>
              <select className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/20 focus:border-[#8b1a1a] transition"
                value={targetDept} onChange={(e) => setTargetDept(e.target.value)}>
                <option value="">Select department…</option>
                {TARGET_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* English Proficiency */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 text-sm mb-4">English Proficiency</h3>
          <p className="text-sm text-gray-600 font-semibold mb-3">Do you have a valid English Proficiency Document? *</p>
          <div className="flex gap-6 mb-4">
            {[{ val: true, label: 'Yes' }, { val: false, label: 'No / I will take the exam' }].map(({ val, label }) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input type="radio" name="proficiency" checked={hasProficiencyDoc === val}
                  onChange={() => setHasProficiencyDoc(val)}
                  className="accent-[#8b1a1a]" />
                {label}
              </label>
            ))}
          </div>
          {!hasProficiencyDoc && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-3">
              ⚠ You will be required to take the YDYO Exam.
            </div>
          )}
          {hasProficiencyDoc && draftId && (
            <DocumentUpload applicationId={draftId} lockedDocumentType="ENGLISH_PROFICIENCY"
              onUploaded={(doc) => setUploadedDocs((prev) => [...prev, doc])} />
          )}
          {hasProficiencyDoc && uploadedDocs.length > 0 && (
            <p className="mt-2 text-sm text-green-600 font-semibold">✓ {uploadedDocs[0].originalFilename} uploaded</p>
          )}
        </div>

        {/* Other Required Documents */}
        {draftId && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 text-sm mb-1">Required Documents</h3>
            <p className="text-xs text-gray-400 mb-4">Upload each required document as a PDF (max 2 MB each).</p>
            <div className="space-y-3">
              {OTHER_DOCUMENT_TYPES.map(({ value, label, required }) => {
                const uploaded = otherDocs[value];
                return (
                  <div key={value} className="flex items-center gap-4 py-2.5 px-3 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                      {required && <span className="ml-1 text-xs text-red-400">*</span>}
                      {uploaded && (
                        <p className="text-xs text-green-600 font-semibold mt-0.5 truncate">
                          ✓ {uploaded.originalFilename}
                        </p>
                      )}
                    </div>
                    <DocumentUpload
                      applicationId={draftId}
                      lockedDocumentType={value}
                      compact
                      onUploaded={(doc) => setOtherDocs((prev) => ({ ...prev, [value]: doc }))}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Confirmation */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <label className="flex items-start gap-3 cursor-pointer text-sm text-amber-800">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-[#8b1a1a]" />
            I confirm that my GPA and Transcript data are correct.
          </label>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 px-8 py-3 bg-[#8b1a1a] hover:bg-[#6b1414] text-white rounded-xl font-semibold text-sm transition disabled:opacity-60">
            ✈ {submitting ? 'Submitting…' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
}
