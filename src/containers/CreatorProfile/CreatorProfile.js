import React from 'react';
import {Button, Image, Message} from 'semantic-ui-react';
import {connect} from 'react-redux';
import {Link} from 'react-router-dom';
import {SideBar} from '../SideBar/SideBar';
import {VideoPreview} from '../../components/VideoPreview/VideoPreview';
import {getCurrentUser, getFirebaseConfigured} from '../../store/reducers/auth';
import {listVideosByOwner} from '../../services/user-videos';
import {getUserProfile} from '../../services/user-profile';
import './CreatorProfile.scss';

class CreatorProfile extends React.Component {
  state = {
    error: null,
    loading: true,
    profile: null,
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
            <VideoPreview
              expanded={true}
              horizontal={true}
              key={video.id}
              pathname='/watch'
              search={`?v=${video.id}`}
              video={video}
            />
          ))}
        </div>
      </React.Fragment>
    );
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
      .then(([profile, videos]) => this.setState({loading: false, profile, videos}))
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
