import firebase from 'firebase/app';
import {firestore, toAuthUser} from './firebase';

export function upsertUserProfile(user, overrides = {}) {
  if (!firestore || !user) {
    return Promise.resolve(toAuthUser(user, overrides));
  }

  const authUser = toAuthUser(user, overrides);
  const userRef = firestore.collection('users').doc(authUser.uid);

  return userRef.get().then((snapshot) => {
    const now = firebase.firestore.FieldValue.serverTimestamp();
    const profile = {
      uid: authUser.uid,
      displayName: authUser.displayName || '',
      email: authUser.email || '',
      photoURL: authUser.photoURL || '',
      providerId: authUser.providerId || 'password',
      lastLoginAt: now,
      updatedAt: now,
    };

    if (!snapshot.exists) {
      profile.createdAt = now;
    }

    return userRef.set(profile, {merge: true}).then(() => authUser);
  });
}

export function getUserProfile(uid) {
  if (!firestore || !uid) {
    return Promise.resolve(null);
  }

  return firestore.collection('users').doc(uid).get().then((snapshot) => {
    if (!snapshot.exists) {
      return null;
    }

    return snapshot.data();
  });
}
