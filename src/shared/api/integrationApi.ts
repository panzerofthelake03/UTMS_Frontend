import axiosInstance from './axiosInstance';

export interface UbysAutofillResponse {
  studentNumber: string;
  department: string;
  faculty: string;
  gpa: number;
  completedCredits: number;
  completedCourses: string[];
  profileUpdated: boolean;
}

export const integrationApi = {
  // IntegrationController returns ResponseEntity<UbysAutofillResponse> directly (no ApiResponse wrapper)
  ubysAutofill: () =>
    axiosInstance.get<UbysAutofillResponse>('/api/integration/ubys/autofill'),
};
