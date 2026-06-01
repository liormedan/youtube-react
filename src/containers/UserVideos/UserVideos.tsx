// @ts-nocheck
import React from 'react';
import {connect} from 'react-redux';
import {SideBar} from '../SideBar/SideBar';
import {VideoPreview} from '../../components/VideoPreview/VideoPreview';
import {getCurrentUser, getFirebaseConfigured} from '../../store/reducers/auth';
import {createUserVideo, listUserVideos} from '../../services/user-videos';
import './UserVideos.scss';

class UserVideos extends React.Component {
  state = {
    description: '',
    error: null,
    loading: false,
    sourceUrl: '',
    success: null,
    title: '',
    videos: [],
  };

  componentDidMount() {
    this.loadVideos();
  }

  render() {
    return (
      <React.Fragment>
        <SideBar/>
        <div className='user-videos'>
          <div className='user-videos__hero'>
            <div>
              <span className='user-videos__eyebrow'>Creator tools</span>
              <h2>Upload a video link</h2>
              <p>Publish YouTube links, public Google Drive links, or direct video files. Public items appear in the home feed.</p>
            </div>
          </div>
          {this.renderForm()}
          {this.renderVideoList()}
        </div>
      </React.Fragment>
    );
  }

  renderForm() {
    if (!this.props.firebaseConfigured) {
      return <div className='user-videos__message'>Firebase is not configured yet. Add your project values to .env.local.</div>;
    }

    if (!this.props.user) {
      return <div className='user-videos__message'>Sign in to upload videos.</div>;
    }

    return (
      <form className='user-videos__form' onSubmit={this.handleSubmit}>
        <div className='user-videos__form-heading'>
          <h3>Video details</h3>
          <p>Use a link that viewers can access. Google Drive files must be shared publicly or with anyone who has the link.</p>
        </div>
        <label className='user-videos__field'>
          <span>Title</span>
          <input name='title' onChange={this.handleInputChange} placeholder='Video title' required value={this.state.title} />
        </label>
        <label className='user-videos__field'>
          <span>Video or Drive link</span>
          <input name='sourceUrl' onChange={this.handleInputChange} placeholder='https://drive.google.com/file/d/... or https://example.com/video.mp4' required value={this.state.sourceUrl} />
        </label>
        <label className='user-videos__field'>
          <span>Description</span>
          <textarea name='description' onChange={this.handleInputChange} placeholder='Short description' value={this.state.description} />
        </label>
        {this.state.error && <div className='user-videos__message user-videos__message--error'>{this.state.error}</div>}
        {this.state.success && <div className='user-videos__message user-videos__message--success'>{this.state.success}</div>}
        <button className='user-videos__submit' disabled={this.state.loading} type='submit'>{this.state.loading ? 'Publishing...' : 'Publish video'}</button>
      </form>
    );
  }

  renderVideoList() {
    if (!this.state.videos.length) {
      return <div className='user-videos__message'>No community videos yet.</div>;
    }

    return (
      <div className='user-videos__list'>
        <h3>Community uploads</h3>
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
    );
  }

  handleInputChange = (event) => {
    const {name, value} = event.target;
    this.setState({[name]: value});
  };

  handleSubmit = (event) => {
    event.preventDefault();
    this.setState({error: null, loading: true, success: null});
    createUserVideo(this.props.user, this.state)
      .then(() => this.setState({
        description: '',
        loading: false,
        sourceUrl: '',
        success: 'Video published.',
        title: '',
      }, () => this.loadVideos()))
      .catch(error => this.setState({error: error.message, loading: false}));
  };

  loadVideos() {
    listUserVideos(50)
      .then(videos => this.setState({videos}))
      .catch(error => this.setState({error: error.message}));
  }
}

function mapStateToProps(state) {
  return {
    firebaseConfigured: getFirebaseConfigured(state),
    user: getCurrentUser(state),
  };
}

export default connect(mapStateToProps)(UserVideos);

