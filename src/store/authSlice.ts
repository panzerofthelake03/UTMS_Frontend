import { AxiosError } from 'axios';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  authApi,
  type CaptchaChallengeResponse,
  type LoginRequest,
  type RegisterStartRequest,
  type RegisterStartResponse,
  type RegisterVerifyRequest,
} from '../shared/api/authApi';

export type UserRole =
  | 'ROLE_STUDENT'
  | 'ROLE_OIDB'
  | 'ROLE_YDYO'
  | 'ROLE_YGK'
  | 'ROLE_INTIBAK'
  | 'ROLE_ADMIN';

interface AuthUser {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface RegistrationState {
  verificationSessionId: string | null;
  maskedEmail: string | null;
  expiresInSeconds: number | null;
  devVerificationCode: string | null;
}

interface CaptchaState {
  captchaId: string | null;
  prompt: string | null;
  expiresInSeconds: number | null;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'failed';
  registerStatus: 'idle' | 'loading' | 'failed';
  captchaStatus: 'idle' | 'loading' | 'failed';
  registration: RegistrationState;
  captcha: CaptchaState;
  error: string | null;
  captchaError: string | null;
}

function parseRole(roles: string[]): UserRole {
  if (roles.includes('ROLE_ADMIN')) return 'ROLE_ADMIN';
  return (roles[0] as UserRole) ?? 'ROLE_STUDENT';
}

function loadPersistedAuth(): Partial<AuthState> {
  try {
    const raw = sessionStorage.getItem('auth');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<{ error?: { message?: string } }>;
  return axiosError.response?.data?.error?.message ?? fallback;
}

const persisted = loadPersistedAuth();

const initialState: AuthState = {
  accessToken: persisted.accessToken ?? null,
  refreshToken: persisted.refreshToken ?? null,
  user: persisted.user ?? null,
  status: 'idle',
  registerStatus: 'idle',
  captchaStatus: 'idle',
  registration: {
    verificationSessionId: null,
    maskedEmail: null,
    expiresInSeconds: null,
    devVerificationCode: null,
  },
  captcha: {
    captchaId: null,
    prompt: null,
    expiresInSeconds: null,
  },
  error: null,
  captchaError: null,
};

export const login = createAsyncThunk('auth/login', async (credentials: LoginRequest, { rejectWithValue }) => {
  try {
    const { data } = await authApi.login(credentials);
    return data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.code === 'ECONNABORTED') {
      return rejectWithValue('Server is taking too long to respond. Please try again later.');
    }
    if (!axiosError.response) {
      return rejectWithValue('System unavailable, please try again later.');
    }
    return rejectWithValue(getApiErrorMessage(error, 'Authentication failed'));
  }
});

export const fetchCaptcha = createAsyncThunk('auth/fetchCaptcha', async (_, { rejectWithValue }) => {
  try {
    const { data } = await authApi.captchaChallenge();
    return data.data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to load CAPTCHA'));
  }
});

export const registerStart = createAsyncThunk(
  'auth/registerStart',
  async (req: RegisterStartRequest, { rejectWithValue }) => {
    try {
      const { data } = await authApi.registerStart(req);
      return data.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to start registration'));
    }
  },
);

export const registerVerify = createAsyncThunk(
  'auth/registerVerify',
  async (req: RegisterVerifyRequest, { rejectWithValue }) => {
    try {
      const { data } = await authApi.registerVerify(req);
      return data.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Verification failed'));
    }
  },
);

export const registerCancel = createAsyncThunk(
  'auth/registerCancel',
  async (verificationSessionId: string, { rejectWithValue }) => {
    try {
      await authApi.registerCancel({ verificationSessionId });
      return verificationSessionId;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to cancel verification'));
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.status = 'idle';
      state.error = null;
      sessionStorage.removeItem('auth');
    },
    setTokens(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      sessionStorage.setItem('auth', JSON.stringify(state));
    },
    clearError(state) {
      state.error = null;
    },
    clearRegistrationFlow(state) {
      state.registration = {
        verificationSessionId: null,
        maskedEmail: null,
        expiresInSeconds: null,
        devVerificationCode: null,
      };
      state.registerStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state: AuthState) => {
      state.status = 'loading';
      state.error = null;
    };
    const handleFulfilled = (state: AuthState, action: PayloadAction<{ accessToken: string; refreshToken: string; email: string; firstName: string; lastName: string; roles: string[] }>) => {
      const payload = action.payload;
      state.accessToken = payload.accessToken;
      state.refreshToken = payload.refreshToken;
      state.user = {
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: parseRole(payload.roles),
      };
      state.status = 'idle';
      sessionStorage.setItem(
        'auth',
        JSON.stringify({
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          user: state.user,
        }),
      );
    };
    const handleRejected = (state: AuthState, action: { payload?: unknown; error?: { message?: string } }) => {
      state.status = 'failed';
      state.error = (action.payload as string | undefined) ?? action.error?.message ?? 'Authentication failed';
    };

    builder
      .addCase(login.pending, handlePending)
      .addCase(login.fulfilled, handleFulfilled)
      .addCase(login.rejected, handleRejected)
      .addCase(registerVerify.pending, handlePending)
      .addCase(registerVerify.fulfilled, (state, action) => {
        handleFulfilled(state, action);
        state.registration = {
          verificationSessionId: null,
          maskedEmail: null,
          expiresInSeconds: null,
          devVerificationCode: null,
        };
      })
      .addCase(registerVerify.rejected, handleRejected)
      .addCase(fetchCaptcha.pending, (state) => {
        state.captchaStatus = 'loading';
        state.captchaError = null;
      })
      .addCase(fetchCaptcha.fulfilled, (state, action: PayloadAction<CaptchaChallengeResponse>) => {
        state.captchaStatus = 'idle';
        state.captchaError = null;
        state.captcha = {
          captchaId: action.payload.captchaId,
          prompt: action.payload.prompt,
          expiresInSeconds: action.payload.expiresInSeconds,
        };
      })
      .addCase(fetchCaptcha.rejected, (state, action) => {
        state.captchaStatus = 'failed';
        state.captchaError = (action.payload as string | undefined) ?? 'Failed to load CAPTCHA';
      })
      .addCase(registerStart.pending, (state) => {
        state.registerStatus = 'loading';
        state.error = null;
      })
      .addCase(registerStart.fulfilled, (state, action: PayloadAction<RegisterStartResponse>) => {
        state.registerStatus = 'idle';
        state.registration = {
          verificationSessionId: action.payload.verificationSessionId,
          maskedEmail: action.payload.maskedEmail,
          expiresInSeconds: action.payload.expiresInSeconds,
          devVerificationCode: action.payload.devVerificationCode,
        };
      })
      .addCase(registerStart.rejected, (state, action) => {
        state.registerStatus = 'failed';
        state.error = (action.payload as string | undefined) ?? 'Failed to start registration';
      })
      .addCase(registerCancel.fulfilled, (state) => {
        state.registration = {
          verificationSessionId: null,
          maskedEmail: null,
          expiresInSeconds: null,
          devVerificationCode: null,
        };
      })
      .addCase(registerCancel.rejected, (state, action) => {
        state.error = (action.payload as string | undefined) ?? state.error;
      });
  },
});

export const { logout, setTokens, clearError, clearRegistrationFlow } = authSlice.actions;
export default authSlice.reducer;
