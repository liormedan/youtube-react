import React from 'react';
import {Button, Form, Message} from 'semantic-ui-react';
import {connect} from 'react-redux';
import {Link} from 'react-router-dom';
import {SideBar} from '../SideBar/SideBar';
import {VideoPreview} from '../../components/VideoPreview/VideoPreview';
import {getCurrentUser, getFirebaseConfigured} from '../../store/reducers/auth';
import {createUserVideo, listVideosByOwner} from '../../services/user-videos';
import './UploadVideo.scss';

class UploadVideo extends React.Component {
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

  componentDidUpdate(prevProps) {
    if (prevProps.user !== this.props.user) {
      this.loadVideos();
    }
  }

  render() {
    return (
      <React.Fragment>
        <SideBar/>
        <div className='upload-video-page'>
          <div className='upload-video-page__hero'>
            <div>
              <span className='upload-video-page__eyebrow'>Creator studio</span>
              <h2>Publish a new upload</h2>
              <p>
                Every publish now updates the public community feed and your personal creator profile at the same time.
              </p>
            </div>
            {this.props.user && (
              <Link to='/studio/profile' className='upload-video-page__profile-link'>
                View my profile
              </Link>
            )}
          </div>
          {this.renderForm()}
          {this.renderRecentUploads()}
        </div>
      </React.Fragment>
    );
  }

  renderForm() {
    if (!this.props.firebaseConfigured) {
      return <Message>Firebase is not configured yet. Add your project values to .env.local.</Message>;
    }

    if (!this.props.user) {
      return <Message>Sign in to publish uploads and connect them to your profile.</Message>;
    }

    return (
      <Form className='upload-video-page__form' error={Boolean(this.state.error)} success={Boolean(this.state.success)} onSubmit={this.handleSubmit}>
        <div className='upload-video-page__form-heading'>
          <h3>Upload details</h3>
          <p>Use a public YouTube, Google Drive, or direct video URL. Published items will appear on Home and in your profile library.</p>
        </div>
        <Message info>
          File storage uploads are not supported yet. Publish links only; Google Drive files must be shared with anyone who has the link.
        </Message>
        <Form.Input
          label='Title'
          name='title'
          onChange={this.handleInputChange}
          placeholder='Video title'
          required
          value={this.state.title}
        />
        <Form.Input
          label='Video link'
          name='sourceUrl'
          onChange={this.handleInputChange}
          placeholder='https://youtu.be/... or https://drive.google.com/file/d/...'
          required
          value={this.state.sourceUrl}
        />
        <Form.TextArea
          label='Description'
          name='description'
          onChange={this.handleInputChange}
          placeholder='Tell viewers what this upload is about'
          value={this.state.description}
        />
        <Message error content={this.state.error}/>
        <Message success content={this.state.success}/>
        <Button className='upload-video-page__submit' loading={this.state.loading} type='submit'>Publish video</Button>
      </Form>
    );
  }

  renderRecentUploads() {
    if (!this.props.user) {
      return null;
    }

    if (!this.state.videos.length) {
      return <Message>You have not published any uploads yet.</Message>;
    }

    return (
      <div className='upload-video-page__list'>
        <div className='upload-video-page__section-heading'>
          <h3>Your latest uploads</h3>
          <Link to='/studio/profile'>Open full profile</Link>
        </div>
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

  handleInputChange = (event, data) => {
    this.setState({[data.name]: data.value});
  };

  handleSubmit = () => {
    this.setState({error: null, loading: true, success: null});
    createUserVideo(this.props.user, this.state)
      .then(() => this.setState({
        description: '',
        loading: false,
        sourceUrl: '',
        success: 'Video published to your profile and the community feed.',
        title: '',
      }, () => this.loadVideos()))
      .catch(error => this.setState({error: error.message, loading: false}));
  };

  loadVideos() {
    if (!this.props.user) {
      this.setState({videos: []});
      return;
    }

    listVideosByOwner(this.props.user.uid, 6)
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

export default connect(mapStateToProps)(UploadVideo);
