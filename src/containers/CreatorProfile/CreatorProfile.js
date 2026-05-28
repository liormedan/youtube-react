import React from 'react';
import {Button, Form, Icon, Image, Label, Message} from 'semantic-ui-react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Link} from 'react-router-dom';
import {SideBar} from '../SideBar/SideBar';
import {VideoPreview} from '../../components/VideoPreview/VideoPreview';
import {getCurrentUser, getFirebaseConfigured} from '../../store/reducers/auth';
import {auth} from '../../services/firebase';
import {authStateChanged} from '../../store/actions/auth';
import {createUserVideo, deleteUserVideo, listVideosByOwner, parseVideoSource, updateUserVideo} from '../../services/user-videos';
import {getUserProfile, updateCurrentUserProfile} from '../../services/user-profile';
import './CreatorProfile.scss';

class CreatorProfile extends React.Component {
  state = {
    editingVideoId: null,
    error: null,
    profileDraft: {
      bio: '',
      displayName: '',
      photoURL: '',
      theme: 'light',
    },
    profileSaving: false,
    loading: true,
    profile: null,
    profileSuccess: null,
    videoDraft: {
      description: '',
      sourceUrl: '',
      title: '',
    },
    uploadDraft: {
      description: '',
      sourceUrl: '',
      title: '',
    },
    uploadSaving: false,
    videoSaving: false,
    videoSuccess: null,
    videos: [],
  };

  componentDidMount() {
    this.loadProfile();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.user !== this.props.user) {
      this.loadProfile();
    }
  }

  render() {
    return (
      <React.Fragment>
        <SideBar/>
        <div className='creator-profile-page'>
          {this.renderContent()}
        </div>
      </React.Fragment>
    );
  }

  renderContent() {
    if (!this.props.firebaseConfigured) {
      return <Message>Firebase is not configured yet. Add your project values to .env.local.</Message>;
    }

    if (!this.props.user) {
      return <Message>Sign in to view your creator profile.</Message>;
    }

    const profile = this.state.profile || this.props.user;
    const avatar = profile.photoURL || this.props.user.photoURL;
    const providerId = profile.providerId || this.props.user.providerId || 'password';

    return (
      <React.Fragment>
        <div className='creator-profile-page__hero'>
          <div className='creator-profile-page__identity'>
            {avatar ? <Image avatar className='creator-profile-page__avatar' src={avatar}/> : <div className='creator-profile-page__avatar creator-profile-page__avatar--placeholder'/>}
            <div>
              <span className='creator-profile-page__eyebrow'>Creator profile</span>
              <h2>{profile.displayName || profile.email || 'Profile and studio settings'}</h2>
              <p>{profile.email || 'Signed-in creator account'}</p>
            </div>
          </div>
          <div className='creator-profile-page__hero-actions'>
            <Label className='creator-profile-page__status' basic>
              <Icon name='check circle'/>
              Connected
            </Label>
            <Link to='/studio/upload'>
              <Button className='creator-profile-page__cta'>Quick upload</Button>
            </Link>
          </div>
        </div>

        {this.renderConnectionCard(profile, providerId)}
        {this.renderProfileForm()}
        <div className='creator-profile-page__stats'>
          <div className='creator-profile-page__stat'>
            <span>Uploads</span>
            <strong>{this.state.videos.length}</strong>
          </div>
          <div className='creator-profile-page__stat'>
            <span>Profile status</span>
            <strong>{this.state.videos.length ? 'Active' : 'Ready to publish'}</strong>
          </div>
          <div className='creator-profile-page__stat'>
            <span>Interface</span>
            <strong>{this.state.profileDraft.theme === 'dark' ? 'Dark' : 'Light'}</strong>
          </div>
        </div>

        {this.state.error && <Message error content={this.state.error}/>}
        {this.state.profileSuccess && <Message success content={this.state.profileSuccess}/>}
        {this.state.videoSuccess && <Message success content={this.state.videoSuccess}/>}

        {this.renderUploadManager()}
        <div className='creator-profile-page__list'>
          <div className='creator-profile-page__list-heading'>
            <h3>Your uploads</h3>
            <span>{this.state.loading ? 'Loading...' : `${this.state.videos.length} item${this.state.videos.length === 1 ? '' : 's'}`}</span>
          </div>
          {!this.state.loading && !this.state.videos.length && (
            <Message>
              No uploads yet. Start with <Link to='/studio/upload'>your first publish</Link>.
            </Message>
          )}
          {this.state.videos.map(video => (
            <div className='creator-profile-page__video-item' key={video.id}>
              {this.renderSourceBadge(video)}
              <VideoPreview
                expanded={true}
                horizontal={true}
                pathname='/watch'
                search={`?v=${video.id}`}
                video={video}
              />
              <div className='creator-profile-page__video-actions'>
                <Button basic onClick={() => this.startEditingVideo(video)} type='button'>Edit</Button>
                <Button basic color='red' onClick={() => this.handleDeleteVideo(video.id)} type='button'>Delete</Button>
              </div>
              {this.state.editingVideoId === video.id && this.renderVideoEditor()}
            </div>
          ))}
        </div>
      </React.Fragment>
    );
  }

  renderConnectionCard(profile, providerId) {
    return (
      <div className='creator-profile-page__panel creator-profile-page__connection'>
        <div className='creator-profile-page__panel-heading'>
          <h3>Account connection</h3>
          <p>Your profile is tied to the signed-in Firebase account.</p>
        </div>
        <div className='creator-profile-page__connection-grid'>
          <div>
            <span>Email</span>
            <strong>{profile.email || this.props.user.email || 'No email'}</strong>
          </div>
          <div>
            <span>Provider</span>
            <strong>{this.providerLabel(providerId)}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>Connected</strong>
          </div>
        </div>
        <Button basic onClick={this.handleSignOut} type='button'>
          <Icon name='sign-out'/>
          Sign out
        </Button>
      </div>
    );
  }

  renderProfileForm() {
    return (
      <Form className='creator-profile-page__panel' onSubmit={this.handleProfileSubmit}>
        <div className='creator-profile-page__panel-heading'>
          <h3>Private profile settings</h3>
          <p>Only you can read and update this profile document. Public upload cards use your display name and avatar snapshot.</p>
        </div>
        <Form.Input
          label='Display name'
          name='displayName'
          onChange={this.handleProfileDraftChange}
          value={this.state.profileDraft.displayName}
        />
        <Form.Input
          label='Avatar URL'
          name='photoURL'
          onChange={this.handleProfileDraftChange}
          value={this.state.profileDraft.photoURL}
        />
        <Form.TextArea
          label='Bio'
          name='bio'
          onChange={this.handleProfileDraftChange}
          value={this.state.profileDraft.bio}
        />
        <div className='creator-profile-page__theme-control'>
          <div>
            <h4>Interface theme</h4>
            <p>Saved to your account and applied after every sign in.</p>
          </div>
          <div className='creator-profile-page__theme-buttons' role='group' aria-label='Interface theme'>
            <Button
              active={this.state.profileDraft.theme === 'light'}
              basic={this.state.profileDraft.theme !== 'light'}
              onClick={() => this.setTheme('light')}
              type='button'>
              <Icon name='sun'/>
              Light
            </Button>
            <Button
              active={this.state.profileDraft.theme === 'dark'}
              basic={this.state.profileDraft.theme !== 'dark'}
              onClick={() => this.setTheme('dark')}
              type='button'>
              <Icon name='moon'/>
              Dark
            </Button>
          </div>
        </div>
        <Button className='creator-profile-page__cta' loading={this.state.profileSaving} type='submit'>Save profile</Button>
      </Form>
    );
  }

  renderUploadManager() {
    const source = parseVideoSource(this.state.uploadDraft.sourceUrl);

    return (
      <Form className='creator-profile-page__panel' error={Boolean(this.state.error)} onSubmit={this.handleCreateVideoSubmit}>
        <div className='creator-profile-page__panel-heading'>
          <h3>Publish a link</h3>
          <p>Manage link-based uploads from your profile. Storage uploads are not supported yet.</p>
        </div>
        <Message info>
          medan-Tube does not store uploaded files right now. Publish public YouTube links, public Google Drive links, or direct video URLs. Google Drive files must be shared with anyone who has the link.
        </Message>
        <Form.Input
          label='Title'
          name='title'
          onChange={this.handleUploadDraftChange}
          placeholder='Video title'
          required
          value={this.state.uploadDraft.title}
        />
        <Form.Input
          label='Video, Drive, or public media link'
          name='sourceUrl'
          onChange={this.handleUploadDraftChange}
          placeholder='https://youtu.be/... or https://drive.google.com/file/d/...'
          required
          value={this.state.uploadDraft.sourceUrl}
        />
        <div className='creator-profile-page__source-preview'>
          <span>Detected source</span>
          {this.renderSourceTypeBadge(source.sourceType)}
        </div>
        <Form.TextArea
          label='Description'
          name='description'
          onChange={this.handleUploadDraftChange}
          placeholder='Tell viewers what this upload is about'
          value={this.state.uploadDraft.description}
        />
        <Button className='creator-profile-page__cta' loading={this.state.uploadSaving} type='submit'>Publish link</Button>
      </Form>
    );
  }

  renderVideoEditor() {
    return (
      <Form className='creator-profile-page__panel creator-profile-page__panel--video' onSubmit={this.handleVideoSubmit}>
        <div className='creator-profile-page__panel-heading'>
          <h3>Edit upload</h3>
          <p>Changes update your private upload library and the public site feed together.</p>
        </div>
        <Form.Input
          label='Title'
          name='title'
          onChange={this.handleVideoDraftChange}
          required
          value={this.state.videoDraft.title}
        />
        <Form.Input
          label='Video link'
          name='sourceUrl'
          onChange={this.handleVideoDraftChange}
          required
          value={this.state.videoDraft.sourceUrl}
        />
        <div className='creator-profile-page__source-preview'>
          <span>Detected source</span>
          {this.renderSourceTypeBadge(parseVideoSource(this.state.videoDraft.sourceUrl).sourceType)}
        </div>
        <Form.TextArea
          label='Description'
          name='description'
          onChange={this.handleVideoDraftChange}
          value={this.state.videoDraft.description}
        />
        <div className='creator-profile-page__editor-actions'>
          <Button className='creator-profile-page__cta' loading={this.state.videoSaving} type='submit'>Save upload</Button>
          <Button basic onClick={this.cancelEditingVideo} type='button'>Cancel</Button>
        </div>
      </Form>
    );
  }

  renderSourceBadge(video) {
    const sourceType = (video.management && video.management.sourceType) || video.snippet.sourceType || 'link';
    return (
      <div className='creator-profile-page__video-badge'>
        {this.renderSourceTypeBadge(sourceType)}
      </div>
    );
  }

  renderSourceTypeBadge(sourceType) {
    const labels = {
      direct: 'Direct video URL',
      drive: 'Google Drive',
      link: 'External link',
      youtube: 'YouTube',
    };

    return (
      <Label className={`creator-profile-page__source-label creator-profile-page__source-label--${sourceType || 'link'}`}>
        {labels[sourceType] || labels.link}
      </Label>
    );
  }

  handleProfileDraftChange = (event, data) => {
    this.setState(({profileDraft}) => ({
      profileDraft: {
        ...profileDraft,
        [data.name]: data.value,
      },
      profileSuccess: null,
    }));
  };

  handleUploadDraftChange = (event, data) => {
    this.setState(({uploadDraft}) => ({
      uploadDraft: {
        ...uploadDraft,
        [data.name]: data.value,
      },
      videoSuccess: null,
    }));
  };

  handleVideoDraftChange = (event, data) => {
    this.setState(({videoDraft}) => ({
      videoDraft: {
        ...videoDraft,
        [data.name]: data.value,
      },
      videoSuccess: null,
    }));
  };

  handleProfileSubmit = () => {
    this.setState({error: null, profileSaving: true, profileSuccess: null});
    updateCurrentUserProfile(this.state.profileDraft)
      .then((profile) => {
        this.props.authStateChanged(profile);
        return this.setState({
          profile,
        profileSaving: false,
        profileSuccess: 'Profile updated. Your private profile document now reflects the new values.',
        }, () => this.loadProfile());
      })
      .catch(error => this.setState({error: error.message, profileSaving: false}));
  };

  handleCreateVideoSubmit = () => {
    this.setState({error: null, uploadSaving: true, videoSuccess: null});
    createUserVideo(this.props.user, this.state.uploadDraft)
      .then(() => this.setState({
        uploadDraft: {
          description: '',
          sourceUrl: '',
          title: '',
        },
        uploadSaving: false,
        videoSuccess: 'Link published to your profile and the public feed.',
      }, () => this.loadProfile()))
      .catch(error => this.setState({error: error.message, uploadSaving: false}));
  };

  startEditingVideo(video) {
    this.setState({
      editingVideoId: video.id,
      videoDraft: {
        description: video.snippet.description || '',
        sourceUrl: video.snippet.sourceUrl || '',
        title: video.snippet.title || '',
      },
      videoSuccess: null,
    });
  }

  cancelEditingVideo = () => {
    this.setState({
      editingVideoId: null,
      videoDraft: {
        description: '',
        sourceUrl: '',
        title: '',
      },
    });
  };

  handleVideoSubmit = () => {
    this.setState({error: null, videoSaving: true, videoSuccess: null});
    updateUserVideo(this.props.user, this.state.editingVideoId, this.state.videoDraft)
      .then(() => this.setState({
        editingVideoId: null,
        videoDraft: {
          description: '',
          sourceUrl: '',
          title: '',
        },
        videoSaving: false,
        videoSuccess: 'Upload updated across your private profile and the public feed.',
      }, () => this.loadProfile()))
      .catch(error => this.setState({error: error.message, videoSaving: false}));
  };

  handleDeleteVideo(videoId) {
    this.setState({error: null, videoSuccess: null});
    deleteUserVideo(this.props.user, videoId)
      .then(() => this.setState({
        editingVideoId: this.state.editingVideoId === videoId ? null : this.state.editingVideoId,
        videoSuccess: 'Upload deleted from your private profile and the public feed.',
      }, () => this.loadProfile()))
      .catch(error => this.setState({error: error.message}));
  }

  handleSignOut = () => {
    auth.signOut();
  };

  setTheme(theme) {
    this.setState(({profileDraft}) => ({
      profileDraft: {
        ...profileDraft,
        theme,
      },
      profileSuccess: null,
    }));
  }

  providerLabel(providerId) {
    if (providerId === 'google.com') {
      return 'Google';
    }

    if (providerId === 'password') {
      return 'Email and password';
    }

    return providerId || 'Firebase Auth';
  }

  loadProfile() {
    if (!this.props.user) {
      this.setState({error: null, loading: false, profile: null, videos: []});
      return;
    }

    this.setState({error: null, loading: true});
    Promise.all([
      getUserProfile(this.props.user.uid),
      listVideosByOwner(this.props.user.uid, 50),
    ])
      .then(([profile, videos]) => this.setState({
        loading: false,
        profile,
        profileDraft: {
          bio: (profile && profile.bio) || '',
          displayName: (profile && profile.displayName) || this.props.user.displayName || '',
          photoURL: (profile && profile.photoURL) || this.props.user.photoURL || '',
          theme: (profile && profile.theme) || this.props.user.theme || 'light',
        },
        videos,
      }))
      .catch(error => this.setState({error: error.message, loading: false}));
  }
}

function mapStateToProps(state) {
  return {
    firebaseConfigured: getFirebaseConfigured(state),
    user: getCurrentUser(state),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({authStateChanged}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(CreatorProfile);
