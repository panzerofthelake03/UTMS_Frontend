import axiosInstance from './axiosInstance';

export interface Application {
  id: number;
  studentId: number;
  status: string;
  term: string;
  applicationNote: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEntry {
  id: number;
  fromStatus: string | null;
  toStatus: string;
  actorEmail: string;
  note: string;
  changedAt: string;
}

export interface Document {
  id: number;
  applicationId: number;
  documentType: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  scanStatus: string;
  createdAt: string;
}

export interface CreateApplicationRequest { term: string; applicationNote?: string }
export interface UpdateApplicationRequest { term?: string; applicationNote?: string }

export const applicationApi = {
  list: () =>
    axiosInstance.get<{ data: Application[] }>('/api/applications/my'),
  get: (id: number) =>
    axiosInstance.get<{ data: Application }>(`/api/applications/${id}`),
  create: (data: CreateApplicationRequest) =>
    axiosInstance.post<{ data: Application }>('/api/applications', data),
  update: (id: number, data: UpdateApplicationRequest) =>
    axiosInstance.put<{ data: Application }>(`/api/applications/${id}`, data),
  submit: (id: number) =>
    axiosInstance.post<{ data: Application }>(`/api/applications/${id}/submit`),
  deleteApplication: (id: number) =>
    axiosInstance.delete(`/api/applications/${id}`),
  timeline: (id: number) =>
    axiosInstance.get<{ data: TimelineEntry[] }>(`/api/applications/${id}/timeline`),
  uploadDocument: (id: number, file: File, documentType: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('documentType', documentType);
    return axiosInstance.post<{ data: Document }>(`/api/applications/${id}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  listDocuments: (id: number) =>
    axiosInstance.get<{ data: Document[] }>(`/api/applications/${id}/documents`),
  downloadDocument: (applicationId: number, documentId: number) =>
    axiosInstance.get<Blob>(`/api/applications/${applicationId}/documents/${documentId}/download`, {
      responseType: 'blob',
    }),
  deleteDocument: (applicationId: number, documentId: number) =>
    axiosInstance.delete(`/api/applications/${applicationId}/documents/${documentId}`),
};
