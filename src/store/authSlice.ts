import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authApi, type LoginRequest, type RegisterRequest } from '../shared/api/authApi';

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

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
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

const persisted = loadPersistedAuth();

const initialState: AuthState = {
  accessToken: persisted.accessToken ?? null,
  refreshToken: persisted.refreshToken ?? null,
  user: persisted.user ?? null,
  status: 'idle',
  error: null,
};

export const login = createAsyncThunk('auth/login', async (credentials: LoginRequest, { rejectWithValue }) => {
  try {
    const { data } = await authApi.login(credentials);
    return data.data;
  } catch (err: any) {
    if (err.response?.data?.error?.message) {
      return rejectWithValue(err.response.data.error.message);
    } else if (err.response?.data?.message) {
      return rejectWithValue(err.response.data.message);
    }
    return rejectWithValue(err.message);
  }
});

export const register = createAsyncThunk('auth/register', async (req: RegisterRequest, { rejectWithValue }) => {
  try {
    const { data } = await authApi.register(req);
    return data.data;
  } catch (err: any) {
    if (err.response?.data?.error?.message) {
      return rejectWithValue(err.response.data.error.message);
    } else if (err.response?.data?.message) {
      return rejectWithValue(err.response.data.message);
    }
    return rejectWithValue(err.message);
  }
});

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
  },
  extraReducers: (builder) => {
    const handlePending = (state: AuthState) => {
      state.status = 'loading';
      state.error = null;
    };
    const handleFulfilled = (state: AuthState, action: ReturnType<typeof login.fulfilled>) => {
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
    const handleRejected = (state: AuthState, action: any) => {
      state.status = 'failed';
      state.error = action.payload || action.error.message || 'Authentication failed';
    };

    builder
      .addCase(login.pending, handlePending)
      .addCase(login.fulfilled, handleFulfilled)
      .addCase(login.rejected, handleRejected)
      .addCase(register.pending, handlePending)
      .addCase(register.fulfilled, handleFulfilled)
      .addCase(register.rejected, handleRejected);
  },
});

export const { logout, setTokens, clearError } = authSlice.actions;
export default authSlice.reducer;
