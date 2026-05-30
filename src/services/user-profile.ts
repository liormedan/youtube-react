// @ts-nocheck
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, firestore, toAuthUser } from './firebase';

export function upsertUserProfile(user, overrides = {}) {
  if (!firestore || !user) {
    return Promise.resolve(toAuthUser(user, overrides));
  }

  const authUser = toAuthUser(user, overrides);
  const userRef = doc(firestore, 'users', authUser.uid);

  return getDoc(userRef).then((snapshot) => {
    const now = serverTimestamp();
    const profile = {
      uid: authUser.uid,
      displayName: authUser.displayName || '',
      email: authUser.email || '',
      photoURL: authUser.photoURL || '',
      providerId: authUser.providerId || 'password',
      lastLoginAt: now,
      updatedAt: now,
    };

    if (!snapshot.exists()) {
      profile.createdAt = now;
    }

    if (Object.prototype.hasOwnProperty.call(overrides, 'bio')) {
      profile.bio = overrides.bio;
    }

    if (Object.prototype.hasOwnProperty.call(overrides, 'theme')) {
      profile.theme = overrides.theme;
    } else if (snapshot.exists() && snapshot.data().theme) {
      profile.theme = snapshot.data().theme;
    } else {
      profile.theme = 'light';
    }

    return setDoc(userRef, profile, { merge: true }).then(() => ({
      ...authUser,
      bio: profile.bio || (snapshot.exists() && snapshot.data().bio) || '',
      theme: profile.theme,
    }));
  });
}

export function updateCurrentUserProfile(input) {
  if (!firestore || !auth || !auth.currentUser) {
    return Promise.reject(new Error('You must be signed in to update your profile.'));
  }

  const displayName = (input.displayName || '').trim();
  const photoURL = (input.photoURL || '').trim();
  const bio = (input.bio || '').trim();
  const theme = input.theme === 'dark' ? 'dark' : 'light';

  return updateProfile(auth.currentUser, {
    displayName,
    photoURL: photoURL || null,
  }).then(() => (
    upsertUserProfile(auth.currentUser, {
      bio,
      displayName,
      photoURL: photoURL || null,
      theme,
    })
  ));
}

export function getUserProfile(uid) {
  if (!firestore || !uid) {
    return Promise.resolve(null);
  }

  const userRef = doc(firestore, 'users', uid);
  return getDoc(userRef).then((snapshot) => {
    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data();
  });
}

