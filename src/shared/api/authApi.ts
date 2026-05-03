import axiosInstance from './axiosInstance';

export interface LoginRequest { email: string; password: string }
export interface RegisterRequest { email: string; password: string; firstName: string; lastName: string }

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export const authApi = {
  login: (data: LoginRequest) =>
    axiosInstance.post<{ data: AuthResponse }>('/api/auth/login', data),
  register: (data: RegisterRequest) =>
    axiosInstance.post<{ data: AuthResponse }>('/api/auth/register', data),
  refresh: (refreshToken: string) =>
    axiosInstance.post<{ data: AuthResponse }>('/api/auth/refresh', { refreshToken }),
};
