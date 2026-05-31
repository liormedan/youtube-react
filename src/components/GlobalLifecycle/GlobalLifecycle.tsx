'use client';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { youtubeLibraryLoaded } from '../../store/actions/api';
import { authError, authStateChanged } from '../../store/actions/auth';
import { installDemoYoutubeApi } from '../../store/api/demo-youtube-api';
import { auth } from '../../services/firebase';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { upsertUserProfile } from '../../services/user-profile';

export function GlobalLifecycle() {
  const dispatch = useDispatch();

  useEffect(() => {
    let unsubscribeAuth;

    function loadYoutubeApi() {
      // This deployment intentionally avoids the live YouTube Data API.
      installDemoYoutubeApi();
      dispatch(youtubeLibraryLoaded());
    }

    function listenForAuthState() {
      if (!auth) {
        dispatch(authStateChanged(null));
        return;
      }

      getRedirectResult(auth).catch((error) => dispatch(authError(error.message)));

      unsubscribeAuth = onAuthStateChanged(auth,
        (user) => {
          if (!user) {
            dispatch(authStateChanged(null));
            return;
          }

          upsertUserProfile(user)
            .then((profile) => dispatch(authStateChanged(profile)))
            .catch((error) => {
              dispatch(authStateChanged(user));
              dispatch(authError(error.message));
            });
        },
        (error) => dispatch(authError(error.message))
      );
    }

    loadYoutubeApi();
    listenForAuthState();

    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
    };
  }, [dispatch]);

  return null;
}
