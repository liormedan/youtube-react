import {createAction} from './index';

export const AUTH_STATE_CHANGED = 'AUTH_STATE_CHANGED';
export const AUTH_ERROR = 'AUTH_ERROR';

export const authStateChanged = (user) => createAction(AUTH_STATE_CHANGED, {user});
export const authError = (error) => createAction(AUTH_ERROR, {error});
