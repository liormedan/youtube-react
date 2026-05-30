// @ts-nocheck
'use client';
import React, { useState } from 'react';
import { Button, Dropdown, Form, Icon, Message } from 'semantic-ui-react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { auth, googleProvider } from '../../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { getAuthError, getCurrentUser, getFirebaseConfigured } from '../../store/reducers/auth';
import { authStateChanged } from '../../store/actions/auth';
import { upsertUserProfile } from '../../services/user-profile';
import './AuthMenu.scss';
import { AppDispatch } from '../../store/configureStore';

export default function AuthMenu() {
  const dispatch = useDispatch<AppDispatch>();

  const globalError = useSelector(getAuthError);
  const firebaseConfigured = useSelector(getFirebaseConfigured);
  const user = useSelector(getCurrentUser);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [mode, setMode] = useState<'signIn' | 'create'>('signIn');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const authErrorMessage = localError || globalError;

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
    signOut(auth);
  };

  const onToggleMode = () => {
    setLocalError(null);
    setMode(prev => prev === 'signIn' ? 'create' : 'signIn');
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>, { name, value }: any) => {
    setLocalError(null);
    if (name === 'email') setEmail(value);
    if (name === 'fullName') setFullName(value);
    if (name === 'password') setPassword(value);
  };

  const canSubmit = () => {
    const hasRequiredName = mode === 'signIn' || fullName.trim();
    return firebaseConfigured && email && password && hasRequiredName && !loading;
  };

  const renderGuestTrigger = () => (
    <Button className='auth-trigger' compact>
      <Icon name='user circle'/>
      Sign in
    </Button>
  );

  const renderUserTrigger = () => {
    if (user?.photoURL) {
      return <img src={user.photoURL} className="ui avatar image" alt="User avatar" />;
    }
    return (
      <Button className='auth-trigger' compact>
        <Icon name='user circle'/>
        {user?.displayName || user?.email}
      </Button>
    );
  };

  const renderSignedOutMenu = () => (
    <Dropdown.Item className='auth-panel'>
      <div className='auth-title'>Connect your account</div>
      {!firebaseConfigured && (
        <Message warning size='mini'>
          Add Firebase values to .env.local to enable sign in.
        </Message>
      )}
      {authErrorMessage && <Message error size='mini'>{authErrorMessage}</Message>}
      <Form>
        <Form.Input
          autoComplete='email'
          disabled={!firebaseConfigured}
          name='email'
          onChange={handleFieldChange}
          placeholder='Email'
          value={email}
        />
        {mode === 'create' && (
          <Form.Input
            autoComplete='name'
            disabled={!firebaseConfigured}
            name='fullName'
            onChange={handleFieldChange}
            placeholder='Full name'
            value={fullName}
          />
        )}
        <Form.Input
          autoComplete='current-password'
          disabled={!firebaseConfigured}
          name='password'
          onChange={handleFieldChange}
          placeholder='Password'
          type='password'
          value={password}
        />
        <Button
          basic
          className='google-button'
          disabled={!firebaseConfigured || loading}
          loading={loading}
          onClick={onGoogleSignIn}
          type='button'>
          <Icon name='google'/>
          Continue with Google
        </Button>
        <Button
          className='auth-primary-button'
          disabled={!canSubmit()}
          loading={loading}
          onClick={mode === 'signIn' ? onSignIn : onCreateAccount}
          type='button'>
          {mode === 'signIn' ? 'Sign in' : 'Create account'}
        </Button>
        <Button
          basic
          disabled={!firebaseConfigured || loading}
          onClick={onToggleMode}
          type='button'>
          {mode === 'signIn' ? 'Create account with email' : 'Back to sign in'}
        </Button>
      </Form>
    </Dropdown.Item>
  );

  const renderSignedInMenu = () => (
    <React.Fragment>
      <Dropdown.Item className='auth-panel'>
        <div className='auth-title'>{user?.displayName || user?.email}</div>
        <div className='auth-subtitle'>Activity saves to Firebase</div>
      </Dropdown.Item>
      <Dropdown.Item as={Link} href='/studio/profile'>
        <Icon name='user'/>
        My profile
      </Dropdown.Item>
      <Dropdown.Item as={Link} href='/studio/upload'>
        <Icon name='plus circle'/>
        New upload
      </Dropdown.Item>
      <Dropdown.Item onClick={onSignOut}>
        <Icon name='sign-out'/>
        Sign out
      </Dropdown.Item>
    </React.Fragment>
  );

  const trigger = user ? renderUserTrigger() : renderGuestTrigger();

  return (
    <Dropdown className='auth-menu' direction='left' icon={null} trigger={trigger}>
      <Dropdown.Menu>
        {user ? renderSignedInMenu() : renderSignedOutMenu()}
      </Dropdown.Menu>
    </Dropdown>
  );
}
