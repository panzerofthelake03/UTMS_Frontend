import axiosInstance from './axiosInstance';

export interface StudentProfile {
  fullName: string;
  email: string;
  nationality: string;
  identityDocumentType: 'TC_ID' | 'PASSPORT';
  tcIdentityNumber: string | null;
  passportNumber: string | null;
  dateOfBirth: string | null;
  identitySerialNo: string | null;
  passportExpirationDate: string | null;
  currentProgram: string | null;
  currentUniversity: string | null;
}

export const studentApi = {
  getProfile: () =>
    axiosInstance.get<{ data: StudentProfile }>('/api/student/profile'),
};
