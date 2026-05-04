import axios from 'axios';
import { store } from '../../store/index';
import { logout, setTokens } from '../../store/authSlice';
import { showToast } from '../components/ToastContainer';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

function isAuthEndpoint(url?: string) {
  if (!url) return false;
  return url.includes('/api/auth/');
}

axiosInstance.interceptors.request.use((config) => {
  // Never attach bearer tokens to auth endpoints (login/register/refresh).
  // This avoids stale token 401s after DB resets from blocking new login/register.
  if (isAuthEndpoint(config.url)) {
    return config;
  }

  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  pendingQueue = [];
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (isAuthEndpoint(original?.url)) {
      return Promise.reject(error);
    }
    if (error.response?.status !== 401 || original._retry) {
      // Show toast for 5xx server errors
      if (error.response?.status >= 500) {
        showToast('A server error occurred. Please try again later.', 'error');
      }
      return Promise.reject(error);
    }
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(original));
          },
          reject,
        });
      });
    }
    original._retry = true;
    isRefreshing = true;
    const refreshToken = store.getState().auth.refreshToken;
    if (!refreshToken) {
      store.dispatch(logout());
      isRefreshing = false;
      return Promise.reject(error);
    }
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh`,
        { refreshToken },
      );
      const { accessToken, refreshToken: newRefresh } = data.data;
      store.dispatch(setTokens({ accessToken, refreshToken: newRefresh }));
      processQueue(null, accessToken);
      original.headers.Authorization = `Bearer ${accessToken}`;
      return axiosInstance(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      store.dispatch(logout());
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosInstance;
