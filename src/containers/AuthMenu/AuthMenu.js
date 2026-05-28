import React from 'react';
import {Button, Dropdown, Form, Icon, Image, Message} from 'semantic-ui-react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Link} from 'react-router-dom';
import {auth, googleProvider} from '../../services/firebase';
import {getAuthError, getCurrentUser, getFirebaseConfigured} from '../../store/reducers/auth';
import {authStateChanged} from '../../store/actions/auth';
import {upsertUserProfile} from '../../services/user-profile';
import './AuthMenu.scss';

class AuthMenu extends React.Component {
  state = {
    email: '',
    fullName: '',
    mode: 'signIn',
    password: '',
    error: null,
    loading: false,
  };

  render() {
    const trigger = this.props.user ? this.renderUserTrigger() : this.renderGuestTrigger();

    return (
      <Dropdown className='auth-menu' direction='left' icon={null} trigger={trigger}>
        <Dropdown.Menu>
          {this.props.user ? this.renderSignedInMenu() : this.renderSignedOutMenu()}
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  renderGuestTrigger() {
    return (
      <Button className='auth-trigger' compact>
        <Icon name='user circle'/>
        Sign in
      </Button>
    );
  }

  renderUserTrigger() {
    const {user} = this.props;
    if (user.photoURL) {
      return <Image src={user.photoURL} avatar/>;
    }
    return (
      <Button className='auth-trigger' compact>
        <Icon name='user circle'/>
        {user.displayName || user.email}
      </Button>
    );
  }

  renderSignedOutMenu() {
    const authErrorMessage = this.state.error || this.props.error;

    return (
      <Dropdown.Item className='auth-panel'>
        <div className='auth-title'>Connect your account</div>
        {!this.props.firebaseConfigured && (
          <Message warning size='mini'>
            Add Firebase values to .env.local to enable sign in.
          </Message>
        )}
        {authErrorMessage && <Message error size='mini'>{authErrorMessage}</Message>}
        <Form>
          <Form.Input
            autoComplete='email'
            disabled={!this.props.firebaseConfigured}
            name='email'
            onChange={this.onFieldChange}
            placeholder='Email'
            value={this.state.email}
          />
          {this.state.mode === 'create' && (
            <Form.Input
              autoComplete='name'
              disabled={!this.props.firebaseConfigured}
              name='fullName'
              onChange={this.onFieldChange}
              placeholder='Full name'
              value={this.state.fullName}
            />
          )}
          <Form.Input
            autoComplete='current-password'
            disabled={!this.props.firebaseConfigured}
            name='password'
            onChange={this.onFieldChange}
            placeholder='Password'
            type='password'
            value={this.state.password}
          />
          <Button
            basic
            className='google-button'
            disabled={!this.props.firebaseConfigured || this.state.loading}
            loading={this.state.loading}
            onClick={this.onGoogleSignIn}
            type='button'>
            <Icon name='google'/>
            Continue with Google
          </Button>
          <Button
            className='auth-primary-button'
            disabled={!this.canSubmit()}
            loading={this.state.loading}
            onClick={this.state.mode === 'signIn' ? this.onSignIn : this.onCreateAccount}
            type='button'>
            {this.state.mode === 'signIn' ? 'Sign in' : 'Create account'}
          </Button>
          <Button
            basic
            disabled={!this.props.firebaseConfigured || this.state.loading}
            onClick={this.onToggleMode}
            type='button'>
            {this.state.mode === 'signIn' ? 'Create account with email' : 'Back to sign in'}
          </Button>
        </Form>
      </Dropdown.Item>
    );
  }

  renderSignedInMenu() {
    return (
      <React.Fragment>
        <Dropdown.Item className='auth-panel'>
          <div className='auth-title'>{this.props.user.displayName || this.props.user.email}</div>
          <div className='auth-subtitle'>Activity saves to Firebase</div>
        </Dropdown.Item>
        <Dropdown.Item as={Link} to='/studio/profile'>
          <Icon name='user'/>
          My profile
        </Dropdown.Item>
        <Dropdown.Item as={Link} to='/studio/upload'>
          <Icon name='plus circle'/>
          New upload
        </Dropdown.Item>
        <Dropdown.Item onClick={this.onSignOut}>
          <Icon name='sign-out'/>
          Sign out
        </Dropdown.Item>
      </React.Fragment>
    );
  }

  canSubmit() {
    const hasRequiredName = this.state.mode === 'signIn' || this.state.fullName.trim();
    return this.props.firebaseConfigured && this.state.email && this.state.password && hasRequiredName && !this.state.loading;
  }

  onFieldChange = (event, data) => {
    this.setState({[data.name]: data.value, error: null});
  };

  onSignIn = () => {
    this.runAuthAction(() => auth.signInWithEmailAndPassword(this.state.email, this.state.password));
  };

  onCreateAccount = () => {
    const displayName = this.state.fullName.trim();
    this.runAuthAction(() => (
      auth.createUserWithEmailAndPassword(this.state.email, this.state.password)
        .then((credential) => (
          credential.user.updateProfile({displayName})
            .then(() => upsertUserProfile(credential.user, {displayName}))
            .then((profile) => {
              this.props.authStateChanged(profile);
              return credential;
            })
        ))
    ));
  };

  onGoogleSignIn = () => {
    this.runAuthAction(() => (
      auth.signInWithPopup(googleProvider)
        .catch((error) => {
          if (this.shouldUseRedirectFallback(error)) {
            return auth.signInWithRedirect(googleProvider);
          }

          throw error;
        })
    ));
  };

  onSignOut = () => {
    auth.signOut();
  };

  onToggleMode = () => {
    this.setState((prevState) => ({
      error: null,
      mode: prevState.mode === 'signIn' ? 'create' : 'signIn',
    }));
  };

  runAuthAction(action) {
    this.setState({loading: true, error: null});
    action()
      .catch(error => this.setState({error: error.message}))
      .finally(() => this.setState({loading: false}));
  }

  shouldUseRedirectFallback(error) {
    return [
      'auth/cancelled-popup-request',
      'auth/operation-not-supported-in-this-environment',
      'auth/popup-blocked',
    ].includes(error && error.code);
  }
}

function mapStateToProps(state) {
  return {
    error: getAuthError(state),
    firebaseConfigured: getFirebaseConfigured(state),
    user: getCurrentUser(state),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({authStateChanged}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(AuthMenu);
