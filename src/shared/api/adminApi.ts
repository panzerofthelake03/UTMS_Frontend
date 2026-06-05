import axiosInstance from './axiosInstance';
import type { Application } from './applicationApi';

export interface StudentProfile {
  fullName: string;
  email: string;
  nationality: string | null;
  identityDocumentType: string | null;
  tcIdentityNumber: string | null;
  passportNumber: string | null;
  dateOfBirth: string | null;
  identitySerialNo: string | null;
  passportExpirationDate: string | null;
  currentProgram: string | null;
  currentUniversity: string | null;
}

export interface PlacementEntry {
  rank: number;
  applicationId: number;
  studentName: string;
  studentNumber: string;
  department: string;
  faculty: string;
  term: string;
  compositeScore: number | null;
  status: string;
}

export interface AdminApplication extends Application {
  studentNumber: string;
  studentFirstName: string;
  studentLastName: string;
  studentEmail: string;
  department: string;
  faculty: string;
  gpa: number | null;
}

export interface EnglishReviewRequest {
  decision: string;
  reviewerNote: string;
}

export interface EvaluationRequest {
  gpaScore: number;
  languageScore: number;
  manualAdjustment?: number;
  adjustmentReason?: string;
  decision: string;
  evaluatorNote?: string;
}

export interface EvaluationResponse {
  id: number;
  applicationId: number;
  compositeScore: number;
  evaluatorNote: string;
  decision: string;
  ydyoDecision: string;
  ydyoNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseExemptionRequest {
  studentCourseCode: string;
  studentCourseName: string;
  studentCourseCredits: number;
  studentCourseGrade?: string;
  targetCourseCode?: string;
  targetCourseName?: string;
  targetCourseCredits?: number;
}

export interface ExemptionDecisionRequest {
  decision: string;       // EXEMPT | PARTIAL | REJECTED
  decisionNote?: string;
}

export interface CourseExemption {
  id: number;
  applicationId: number;
  studentCourseCode: string;
  studentCourseName: string;
  studentCourseCredits: number;
  studentCourseGrade: string | null;
  targetCourseCode: string | null;
  targetCourseName: string | null;
  targetCourseCredits: number | null;
  decision: string | null;
  decisionNote: string | null;
  decidedByEmail: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export const adminApi = {
  // OIDB
  intibakQueueList: () =>
    axiosInstance.get<{ data: AdminApplication[] }>('/api/intibak/applications'),

  // OIDB
  oidbList: () =>
    axiosInstance.get<{ data: AdminApplication[] }>('/api/oidb/applications'),
  oidbTakeReview: (id: number) =>
    axiosInstance.post<{ data: AdminApplication }>(`/api/oidb/applications/${id}/take-review`),
  oidbForwardYdyo: (id: number, note: string) =>
    axiosInstance.post<{ data: AdminApplication }>(`/api/oidb/applications/${id}/forward-ydyo`, { note }),
  /** UC 3.2 — full student identity profile for a given application */
  oidbGetStudentProfile: (id: number) =>
    axiosInstance.get<{ data: StudentProfile }>(`/api/oidb/applications/${id}/student-profile`),

  // YDYO
  ydyoList: () =>
    axiosInstance.get<{ data: AdminApplication[] }>('/api/ydyo/applications'),
  ydyoEnglishReview: (id: number, data: EnglishReviewRequest) =>
    axiosInstance.post<{ data: AdminApplication }>(`/api/ydyo/applications/${id}/english-review`, data),
  /** UC 2.1 - Set inline decision (PASS / FAIL / DOCUMENT_REQUIRED) */
  ydyoSetDecision: (id: number, decision: string) =>
    axiosInstance.put<{ data: AdminApplication }>(`/api/ydyo/applications/${id}/decision`, { decision }),
  /** UC 2.1 - Batch send all decided applications to OIDB */
  ydyoSendToOidb: () =>
    axiosInstance.post<{ data: { processed: number } }>('/api/ydyo/send-to-oidb'),

  // YGK
  ygkList: () =>
    axiosInstance.get<{ data: AdminApplication[] }>('/api/ygk/applications'),
  ygkGetEvaluation: (id: number) =>
    axiosInstance.get<{ data: EvaluationResponse }>(`/api/ygk/applications/${id}/evaluation`),
  ygkEvaluate: (id: number, data: EvaluationRequest) =>
    axiosInstance.post<{ data: EvaluationResponse }>(`/api/ygk/applications/${id}/evaluate`, data),

  // Dean (UC 4.1)
  deanList: () =>
    axiosInstance.get<{ data: AdminApplication[] }>('/api/dean/applications'),
  deanApprove: (id: number, note?: string) =>
    axiosInstance.post<{ data: AdminApplication }>(`/api/dean/applications/${id}/approve`, { note }),
  deanReject: (id: number, note?: string) =>
    axiosInstance.post<{ data: AdminApplication }>(`/api/dean/applications/${id}/reject`, { note }),

  // YGK Placement (UC 5.2)
  ygkPlacement: () =>
    axiosInstance.get<{ data: PlacementEntry[] }>('/api/ygk/placement'),

  // OIDB Results (UC 5.3)
  oidbResults: () =>
    axiosInstance.get<{ data: AdminApplication[] }>('/api/oidb/results'),

  // Intibak
  intibakListExemptions: (id: number) =>
    axiosInstance.get<{ data: CourseExemption[] }>(`/api/intibak/${id}/exemptions`),
  intibakCreateExemption: (id: number, data: CourseExemptionRequest) =>
    axiosInstance.post<{ data: CourseExemption }>(`/api/intibak/${id}/exemptions`, data),
  intibakDecideExemption: (id: number, exemptionId: number, data: ExemptionDecisionRequest) =>
    axiosInstance.put<{ data: CourseExemption }>(`/api/intibak/${id}/exemptions/${exemptionId}/decide`, data),
};
