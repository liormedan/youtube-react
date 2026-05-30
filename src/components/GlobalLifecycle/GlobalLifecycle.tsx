'use client';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { youtubeLibraryLoaded } from '../../store/actions/api';
import { authError, authStateChanged } from '../../store/actions/auth';
import { installDemoYoutubeApi } from '../../store/api/demo-youtube-api';
import { auth } from '../../services/firebase';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { upsertUserProfile } from '../../services/user-profile';

const API_KEY = process.env.NEXT_PUBLIC_YT_API_KEY || process.env.REACT_APP_YT_API_KEY;

export function GlobalLifecycle() {
  const dispatch = useDispatch();

  useEffect(() => {
    let unsubscribeAuth;

    function loadYoutubeApi() {
      if (!API_KEY) {
        installDemoYoutubeApi();
        dispatch(youtubeLibraryLoaded());
        return;
      }

      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/client.js";

      script.onload = () => {
        (window as any).gapi.load('client', () => {
          (window as any).gapi.client.setApiKey(API_KEY);
          (window as any).gapi.client.load('youtube', 'v3', () => {
            dispatch(youtubeLibraryLoaded());
          });
        });
      };

      document.body.appendChild(script);
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
