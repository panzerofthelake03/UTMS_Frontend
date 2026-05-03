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
  note: string;
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
  oidbForwardYdyo: (id: number, note: string) =>
    axiosInstance.post<{ data: AdminApplication }>(`/api/oidb/applications/${id}/forward-ydyo`, { note }),

  // YDYO
  ydyoList: () =>
    axiosInstance.get<{ data: AdminApplication[] }>('/api/ydyo/applications'),
  ydyoEnglishReview: (id: number, data: EnglishReviewRequest) =>
    axiosInstance.post<{ data: AdminApplication }>(`/api/ydyo/applications/${id}/english-review`, data),

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
