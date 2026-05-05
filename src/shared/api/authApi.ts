import axiosInstance from './axiosInstance';

export interface LoginRequest { email: string; password: string }
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
  identityDocumentType: 'TC_ID' | 'PASSPORT';
  tcIdentityNumber?: string;
  identitySerialNo?: string;
  passportNumber?: string;
  passportExpirationDate?: string;
  currentProgram: string;
  currentUniversity: string;
}

export interface CaptchaChallengeResponse {
  captchaId: string;
  prompt: string;
  expiresInSeconds: number;
}

export interface RegisterStartRequest extends RegisterRequest {
  captchaId: string;
  captchaAnswer: string;
}

export interface RegisterStartResponse {
  verificationSessionId: string;
  maskedEmail: string;
  expiresInSeconds: number;
  devVerificationCode: string | null;
}

export interface RegisterVerifyRequest {
  verificationSessionId: string;
  code: string;
}

export interface RegisterCancelRequest {
  verificationSessionId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export const authApi = {
  captchaChallenge: () =>
    axiosInstance.get<{ data: CaptchaChallengeResponse }>('/api/auth/captcha/challenge'),
  login: (data: LoginRequest) =>
    axiosInstance.post<{ data: AuthResponse }>('/api/auth/login', data),
  registerStart: (data: RegisterStartRequest) =>
    axiosInstance.post<{ data: RegisterStartResponse }>('/api/auth/register/start', data),
  registerVerify: (data: RegisterVerifyRequest) =>
    axiosInstance.post<{ data: AuthResponse }>('/api/auth/register/verify', data),
  registerCancel: (data: RegisterCancelRequest) =>
    axiosInstance.post<{ data: null }>('/api/auth/register/cancel', data),
  refresh: (refreshToken: string) =>
    axiosInstance.post<{ data: AuthResponse }>('/api/auth/refresh', { refreshToken }),
};
