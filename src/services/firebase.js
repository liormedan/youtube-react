import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

const config = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId
);

const app = isFirebaseConfigured && !firebase.apps.length
  ? firebase.initializeApp(config)
  : firebase.apps[0];

export const auth = app ? firebase.auth() : null;
export const firestore = app ? firebase.firestore() : null;
export const googleProvider = app ? new firebase.auth.GoogleAuthProvider() : null;

export function toAuthUser(user, overrides = {}) {
  if (!user) {
    return null;
  }

  const provider = user.providerData && user.providerData.length ? user.providerData[0] : {};

  return {
    uid: user.uid,
    displayName: overrides.displayName || user.displayName,
    email: user.email,
    photoURL: overrides.photoURL || user.photoURL,
    providerId: overrides.providerId || provider.providerId || 'password',
  };
}
