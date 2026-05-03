import { useRef, useState } from 'react';
import { applicationApi, type Document } from '../../../shared/api/applicationApi';

const MAX_SIZE_MB = 2;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface Props {
  applicationId: number;
  onUploaded: (doc: Document) => void;
}

export default function DocumentUpload({ applicationId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setClientError(null);
    setServerError(null);

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
      const res = await applicationApi.uploadDocument(applicationId, file, 'ENGLISH_PROFICIENCY');
      onUploaded(res.data.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setServerError(e.response?.data?.error?.message ?? 'Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <label htmlFor="doc-upload" style={labelBtn}>
        {uploading ? 'Uploading…' : 'Choose PDF to upload'}
      </label>
      <input
        id="doc-upload"
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
  padding: '8px 16px',
  background: '#1d3c6e',
  color: '#fff',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};
const errStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  color: '#b91c1c',
  background: '#fef2f2',
  padding: '6px 10px',
  borderRadius: 4,
};
