import { configureStore, type Reducer } from '@reduxjs/toolkit';
import authReducer, { type AuthState } from './authSlice';

const reducer: { auth: Reducer<AuthState> } = {
  auth: authReducer,
};

export const store = configureStore({
  reducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
