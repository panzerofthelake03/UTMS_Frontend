import axiosInstance from './axiosInstance';
import type { Application } from './applicationApi';

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

  // Intibak
  intibakListExemptions: (id: number) =>
    axiosInstance.get<{ data: CourseExemption[] }>(`/api/intibak/${id}/exemptions`),
  intibakCreateExemption: (id: number, data: CourseExemptionRequest) =>
    axiosInstance.post<{ data: CourseExemption }>(`/api/intibak/${id}/exemptions`, data),
  intibakDecideExemption: (id: number, exemptionId: number, data: ExemptionDecisionRequest) =>
    axiosInstance.put<{ data: CourseExemption }>(`/api/intibak/${id}/exemptions/${exemptionId}/decide`, data),
};
