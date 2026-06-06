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

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="p-6 md:p-10 max-w-2xl">
        <div className="px-4 py-3 text-sm rounded-xl bg-red-50 border border-red-200 text-red-700">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 md:p-10 max-w-2xl">
        <div className="px-4 py-3 text-sm rounded-xl bg-red-50 border border-red-200 text-red-700">Profile data not found.</div>
      </div>
    );
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
    <div className="p-6 md:p-10 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">My Profile</h1>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <ProfileRow label="Full Name" value={profile.fullName} />
        <ProfileRow label="Email" value={profile.email} />
        <ProfileRow label="Nationality" value={toDisplayNationality(profile.nationality)} />
        <ProfileRow label="Date of Birth" value={formatDate(profile.dateOfBirth)} />
        <ProfileRow label="Identity Document Type" value={profile.identityDocumentType === 'TC_ID' ? 'National ID (TC)' : 'Passport'} />
        <ProfileRow label="TC / Passport No" value={idNumber} />
        <ProfileRow label={identityDetailLabel} value={identityDetailValue} last />
        <ProfileRow label="Current Program" value={profile.currentProgram} />
        <ProfileRow label="Current University" value={profile.currentUniversity} last />
      </div>
    </div>
  );
}

function ProfileRow({ label, value, last }: { label: string; value: string | null | undefined; last?: boolean }) {
  return (
    <div className={`grid grid-cols-[220px_1fr] ${last ? '' : 'border-b border-gray-50'}`}>
      <div className="px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center">
        {label}
      </div>
      <div className="px-5 py-3 text-sm text-gray-800 font-medium">
        {value && value.trim() !== '' ? value : '—'}
      </div>
    </div>
  );
}

function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function toDisplayNationality(value: string | null | undefined): string {
  if (!value) return '—';
  if (value.toUpperCase() === 'TURKISH') return 'Turkish';
  if (value.toUpperCase() === 'NON_TURKISH') return 'Non-Turkish';
  return value;
}
