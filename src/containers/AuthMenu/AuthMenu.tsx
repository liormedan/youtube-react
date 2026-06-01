// @ts-nocheck
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { auth, googleProvider, isFirebaseConfigured } from '../../services/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile
} from 'firebase/auth';
import { getAuthError, getCurrentUser } from '../../store/reducers/auth';
import { authStateChanged } from '../../store/actions/auth';
import { upsertUserProfile } from '../../services/user-profile';
import './AuthMenu.scss';
import { AppDispatch } from '../../store/configureStore';

const iconGlyphs = {
  user: 'U',
  google: 'G',
  upload: '+',
  signout: '→',
};

function AuthIcon({ name }) {
  return <span aria-hidden='true' className='auth-icon'>{iconGlyphs[name] || '•'}</span>;
}

export default function AuthMenu() {
  const dispatch = useDispatch<AppDispatch>();

  const globalError = useSelector(getAuthError);
  const user = useSelector(getCurrentUser);
  const firebaseConfigured = isFirebaseConfigured;

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [mode, setMode] = useState<'signIn' | 'create'>('signIn');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const authErrorMessage = localError || globalError;

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!containerRef.current) {
        return;
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleDocumentClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [open]);

  const runAuthAction = (action: () => Promise<any>) => {
    setLoading(true);
    setLocalError(null);
    action()
      .catch(err => setLocalError(err.message))
      .finally(() => setLoading(false));
  };

  const onSignIn = () => {
    runAuthAction(() => signInWithEmailAndPassword(auth, email, password));
  };

  const onCreateAccount = () => {
    const trimmedName = fullName.trim();
    runAuthAction(() =>
      createUserWithEmailAndPassword(auth, email, password)
        .then((credential) => {
          return updateProfile(credential.user, { displayName: trimmedName })
            .then(() => upsertUserProfile(credential.user, { displayName: trimmedName }))
            .then((profile) => {
              dispatch(authStateChanged(profile));
              return credential;
            });
        })
    );
  };

  const shouldUseRedirectFallback = (error: any) => {
    return [
      'auth/cancelled-popup-request',
      'auth/operation-not-supported-in-this-environment',
      'auth/popup-blocked',
    ].includes(error && error.code);
  };

  const onGoogleSignIn = () => {
    runAuthAction(() =>
      signInWithPopup(auth, googleProvider)
        .catch((err) => {
          if (shouldUseRedirectFallback(err)) {
            return signInWithRedirect(auth, googleProvider);
          }
          throw err;
        })
    );
  };

  const onSignOut = () => {
    setOpen(false);
    signOut(auth);
  };

  const onToggleMode = () => {
    setLocalError(null);
    setMode(prev => prev === 'signIn' ? 'create' : 'signIn');
  };

  const canSubmit = () => {
    const hasRequiredName = mode === 'signIn' || fullName.trim();
    return firebaseConfigured && email && password && hasRequiredName && !loading;
  };

  const renderGuestTrigger = () => (
    <span className='auth-trigger'>
      <AuthIcon name='user' />
      Sign in
    </span>
  );

  const renderUserTrigger = () => {
    if (user?.photoURL) {
      return <img src={user.photoURL} className='auth-avatar' alt='User avatar' />;
    }
    return (
      <span className='auth-trigger'>
        <AuthIcon name='user' />
        {user?.displayName || user?.email}
      </span>
    );
  };

  const renderSignedOutMenu = () => (
    <div className='auth-panel'>
      <div className='auth-title'>Connect your account</div>
      {!firebaseConfigured && (
        <div className='auth-message auth-message--warning'>
          Add Firebase values to `.env.local` to enable sign in.
        </div>
      )}
      {authErrorMessage && <div className='auth-message auth-message--error'>{authErrorMessage}</div>}
      <form className='auth-form' onSubmit={(event) => event.preventDefault()}>
        <input
          autoComplete='email'
          className='auth-input'
          disabled={!firebaseConfigured}
          name='email'
          onChange={(event) => {
            setLocalError(null);
            setEmail(event.target.value);
          }}
          placeholder='Email'
          type='email'
          value={email}
        />
        {mode === 'create' && (
          <input
            autoComplete='name'
            className='auth-input'
            disabled={!firebaseConfigured}
            name='fullName'
            onChange={(event) => {
              setLocalError(null);
              setFullName(event.target.value);
            }}
            placeholder='Full name'
            type='text'
            value={fullName}
          />
        )}
        <input
          autoComplete='current-password'
          className='auth-input'
          disabled={!firebaseConfigured}
          name='password'
          onChange={(event) => {
            setLocalError(null);
            setPassword(event.target.value);
          }}
          placeholder='Password'
          type='password'
          value={password}
        />
        <button
          className='auth-secondary-button google-button'
          disabled={!firebaseConfigured || loading}
          onClick={onGoogleSignIn}
          type='button'>
          <AuthIcon name='google' />
          <span>{loading ? 'Working...' : 'Continue with Google'}</span>
        </button>
        <button
          className='auth-primary-button'
          disabled={!canSubmit()}
          onClick={mode === 'signIn' ? onSignIn : onCreateAccount}
          type='button'>
          {loading ? 'Working...' : mode === 'signIn' ? 'Sign in' : 'Create account'}
        </button>
        <button
          className='auth-secondary-button'
          disabled={!firebaseConfigured || loading}
          onClick={onToggleMode}
          type='button'>
          {mode === 'signIn' ? 'Create account with email' : 'Back to sign in'}
        </button>
      </form>
    </div>
  );

  const renderSignedInMenu = () => (
    <React.Fragment>
      <div className='auth-panel auth-panel--summary'>
        <div className='auth-title'>{user?.displayName || user?.email}</div>
        <div className='auth-subtitle'>Activity saves to Firebase</div>
      </div>
      <Link className='auth-link' href='/studio/profile' onClick={() => setOpen(false)}>
        <AuthIcon name='user' />
        My profile
      </Link>
      <Link className='auth-link' href='/studio/upload' onClick={() => setOpen(false)}>
        <AuthIcon name='upload' />
        New upload
      </Link>
      <button className='auth-link auth-link--button' onClick={onSignOut} type='button'>
        <AuthIcon name='signout' />
        Sign out
      </button>
    </React.Fragment>
  );

  const trigger = user ? renderUserTrigger() : renderGuestTrigger();

  return (
    <div className='auth-menu' ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup='menu'
        className='auth-menu__trigger'
        onClick={() => setOpen(prev => !prev)}
        type='button'>
        {trigger}
      </button>
      {open && (
        <div className='auth-menu__panel' role='menu'>
          {user ? renderSignedInMenu() : renderSignedOutMenu()}
        </div>
      )}
    </div>
  );
}
