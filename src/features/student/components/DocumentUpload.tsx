import { useRef, useState } from 'react';
import { applicationApi, type Document } from '../../../shared/api/applicationApi';

const MAX_SIZE_MB = 2;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface Props {
  applicationId: number;
  onUploaded: (doc: Document) => void;
  lockedDocumentType?: string;
  compact?: boolean;
}

const DOCUMENT_TYPES = [
  { value: 'OSYM_PUAN',          label: 'ÖSYM Puan Belgesi' },
  { value: 'OGRENCI_BELGESI',    label: 'Öğrenci Belgesi' },
  { value: 'DERS_KATALOG',       label: 'Ders Kataloğu' },
  { value: 'IDENTITY',           label: 'Kimlik Belgesi' },
  { value: 'TRANSCRIPT',         label: 'Transkript' },
  { value: 'OSYM_YERLESTIRME',   label: 'ÖSYM Yerleştirme Belgesi' },
  { value: 'ENGLISH_PROFICIENCY', label: 'Yabancı Dil Belgesi' },
  { value: 'INTIBAK',            label: 'İntibak Belgesi' },
];

export default function DocumentUpload({ applicationId, onUploaded, lockedDocumentType, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState(lockedDocumentType ?? '');
  const [clientError, setClientError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const effectiveDocumentType = lockedDocumentType ?? documentType;

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setClientError(null);
    setServerError(null);

    if (!effectiveDocumentType) {
      setClientError('Please select a document type before uploading.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    if (file.type !== 'application/pdf') {
      setClientError('Only PDF files are accepted.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setClientError(`File size exceeds ${MAX_SIZE_MB} MB limit.`);
      return;
    }

    setUploading(true);
    try {
      const res = await applicationApi.uploadDocument(applicationId, file, effectiveDocumentType);
      onUploaded(res.data.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setServerError(e.response?.data?.error?.message ?? 'Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const uploadId = `doc-upload-${lockedDocumentType ?? 'free'}`;

  if (compact) {
    return (
      <div style={{ flexShrink: 0 }}>
        <label htmlFor={uploadId} style={compactBtn}>
          {uploading ? '...' : 'PDF Yükle'}
        </label>
        <input
          id={uploadId}
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleChange}
          disabled={uploading}
          style={{ display: 'none' }}
        />
        {(clientError || serverError) && (
          <div style={{ ...errStyle, marginTop: 4, maxWidth: 200, fontSize: 11 }}>
            {clientError ?? serverError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {lockedDocumentType ? (
        <div style={lockedTypeBox}>
          Document type: <strong>{lockedDocumentType}</strong>
        </div>
      ) : (
        <>
          <label htmlFor="doc-type" style={labelStyle}>Document type</label>
          <select
            id="doc-type"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            disabled={uploading}
            style={selectStyle}
          >
            <option value="">Select document type...</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </>
      )}

      <label htmlFor={uploadId} style={labelBtn}>
        {uploading ? 'Uploading...' : 'Choose PDF to upload'}
      </label>
      <input
        id={uploadId}
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleChange}
        disabled={uploading}
        style={{ display: 'none' }}
      />
      {clientError && <div style={errStyle}>{clientError}</div>}
      {serverError && <div style={errStyle}>{serverError}</div>}
    </div>
  );
}

const labelBtn: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 8,
  padding: '8px 16px',
  background: '#1d3c6e',
  color: '#fff',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};
const labelStyle: React.CSSProperties = {
  display: 'block',
  marginTop: 4,
  marginBottom: 6,
  fontSize: 13,
  fontWeight: 600,
};
const selectStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 320,
  padding: '8px 10px',
  border: '1px solid #d1d5db',
  borderRadius: 4,
  fontSize: 13,
};
const lockedTypeBox: React.CSSProperties = {
  marginTop: 4,
  marginBottom: 6,
  fontSize: 12,
  color: '#374151',
};
const compactBtn: React.CSSProperties = {
  display: 'inline-block',
  padding: '6px 14px',
  background: '#8b1a1a',
  color: '#fff',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: 'nowrap',
};
const errStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  color: '#b91c1c',
  background: '#fef2f2',
  padding: '6px 10px',
  borderRadius: 4,
};
