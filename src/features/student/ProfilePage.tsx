import { useEffect, useState } from 'react';
import Spinner from '../../shared/components/Spinner';
import { studentApi, type StudentProfile } from '../../shared/api/studentApi';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    studentApi.getProfile()
      .then((response) => setProfile(response.data.data))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load profile';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <div style={errorStyle}>{error}</div>;
  }

  if (!profile) {
    return <div style={errorStyle}>Profile data not found.</div>;
  }

  const idNumber = profile.identityDocumentType === 'TC_ID'
    ? profile.tcIdentityNumber
    : profile.passportNumber;

  const identityDetailLabel = profile.identityDocumentType === 'TC_ID'
    ? 'Identity Serial No'
    : 'Passport Expiration Date';

  const identityDetailValue = profile.identityDocumentType === 'TC_ID'
    ? profile.identitySerialNo
    : formatDate(profile.passportExpirationDate);

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>My Profile</h2>
      <div style={cardStyle}>
        <Row label="Full Name" value={profile.fullName} />
        <Row label="Email" value={profile.email} />
        <Row label="Nationality" value={toDisplayNationality(profile.nationality)} />
        <Row label="Date of Birth (DD/MM/YYYY)" value={formatDate(profile.dateOfBirth)} />
        <Row label="Identity Document Type" value={profile.identityDocumentType === 'TC_ID' ? 'National ID (TC)' : 'Passport'} />
        <Row label="TC / Passport No" value={idNumber} />
        <Row label={identityDetailLabel} value={identityDetailValue} />
        <Row label="Current Program" value={profile.currentProgram} />
        <Row label="Current University" value={profile.currentUniversity} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={rowStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value && value.trim() !== '' ? value : '-'}</div>
    </div>
  );
}

function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return '-';
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return isoDate;
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function toDisplayNationality(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  if (value.toUpperCase() === 'TURKISH') {
    return 'Turkish';
  }

  if (value.toUpperCase() === 'NON_TURKISH') {
    return 'Non-Turkish';
  }

  return value;
}

const containerStyle: React.CSSProperties = {
  maxWidth: 760,
};

const titleStyle: React.CSSProperties = {
  color: '#1d3c6e',
  marginBottom: 16,
};

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  overflow: 'hidden',
};

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '280px 1fr',
  borderBottom: '1px solid #f3f4f6',
};

const labelStyle: React.CSSProperties = {
  background: '#f9fafb',
  padding: '12px 14px',
  fontWeight: 600,
  color: '#374151',
};

const valueStyle: React.CSSProperties = {
  padding: '12px 14px',
  color: '#111827',
};

const errorStyle: React.CSSProperties = {
  border: '1px solid #fca5a5',
  background: '#fef2f2',
  color: '#b91c1c',
  borderRadius: 6,
  padding: '12px 14px',
};
