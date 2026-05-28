import React from 'react';
import {Button, Form, Image, Message} from 'semantic-ui-react';
import {connect} from 'react-redux';
import {Link} from 'react-router-dom';
import {SideBar} from '../SideBar/SideBar';
import {VideoPreview} from '../../components/VideoPreview/VideoPreview';
import {getCurrentUser, getFirebaseConfigured} from '../../store/reducers/auth';
import {deleteUserVideo, listVideosByOwner, updateUserVideo} from '../../services/user-videos';
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

    return (
      <React.Fragment>
        <div className='creator-profile-page__hero'>
          <div className='creator-profile-page__identity'>
            {avatar ? <Image avatar className='creator-profile-page__avatar' src={avatar}/> : <div className='creator-profile-page__avatar creator-profile-page__avatar--placeholder'/>}
            <div>
              <span className='creator-profile-page__eyebrow'>Creator profile</span>
              <h2>{profile.displayName || profile.email || 'medan-Tube creator'}</h2>
              <p>{profile.email || 'Signed-in creator account'}</p>
            </div>
          </div>
          <Link to='/studio/upload'>
            <Button className='creator-profile-page__cta'>+ New upload</Button>
          </Link>
        </div>

        {this.renderProfileForm(profile)}
        <div className='creator-profile-page__stats'>
          <div className='creator-profile-page__stat'>
            <span>Uploads</span>
            <strong>{this.state.videos.length}</strong>
          </div>
          <div className='creator-profile-page__stat'>
            <span>Profile status</span>
            <strong>{this.state.videos.length ? 'Active' : 'Ready to publish'}</strong>
          </div>
        </div>

        {this.state.error && <Message error content={this.state.error}/>}
        {this.state.profileSuccess && <Message success content={this.state.profileSuccess}/>}
        {this.state.videoSuccess && <Message success content={this.state.videoSuccess}/>}

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

  renderProfileForm(profile) {
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
        <Button className='creator-profile-page__cta' loading={this.state.profileSaving} type='submit'>Save profile</Button>
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

  handleProfileDraftChange = (event, data) => {
    this.setState(({profileDraft}) => ({
      profileDraft: {
        ...profileDraft,
        [data.name]: data.value,
      },
      profileSuccess: null,
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
      .then(() => this.setState({
        profileSaving: false,
        profileSuccess: 'Profile updated. Your private profile document now reflects the new values.',
      }, () => this.loadProfile()))
      .catch(error => this.setState({error: error.message, profileSaving: false}));
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

export default connect(mapStateToProps)(CreatorProfile);
