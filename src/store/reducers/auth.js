import {AUTH_ERROR, AUTH_STATE_CHANGED} from '../actions/auth';
import {isFirebaseConfigured} from '../../services/firebase';

const initialState = {
  error: null,
  firebaseConfigured: isFirebaseConfigured,
  initialized: false,
  user: null,
};

export default function auth(state = initialState, action) {
  switch (action.type) {
    case AUTH_STATE_CHANGED:
      return {
        ...state,
        error: null,
        initialized: true,
        user: action.user,
      };
    case AUTH_ERROR:
      return {
        ...state,
        error: action.error,
        initialized: true,
      };
    default:
      return state;
  }
}

export const getCurrentUser = (state) => state.auth.user;
export const getAuthError = (state) => state.auth.error;
export const getFirebaseConfigured = (state) => state.auth.firebaseConfigured;
export const getAuthInitialized = (state) => state.auth.initialized;
