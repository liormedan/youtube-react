// @ts-nocheck
import { createSlice } from '@reduxjs/toolkit';
import { isFirebaseConfigured } from '../../services/firebase';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    error: null,
    firebaseConfigured: isFirebaseConfigured,
    initialized: false,
    user: null,
  },
  reducers: {
    authStateChanged: (state, action) => {
      state.error = null;
      state.initialized = true;
      state.user = action.payload;
    },
    authError: (state, action) => {
      state.error = action.payload;
      state.initialized = true;
    },
  },
});

export const { authStateChanged, authError } = authSlice.actions;

export const getCurrentUser = (state) => state.auth.user;
export const getAuthError = (state) => state.auth.error;
export const getFirebaseConfigured = (state) => state.auth.firebaseConfigured;
export const getAuthInitialized = (state) => state.auth.initialized;

export default authSlice.reducer;

