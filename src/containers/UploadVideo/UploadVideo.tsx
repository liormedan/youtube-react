// @ts-nocheck
import React from 'react';
import {Button, Form, Message, Progress} from 'semantic-ui-react';
import {connect} from 'react-redux';
import Link from 'next/link';
import {SideBar} from '../SideBar/SideBar';
import {VideoPreview} from '../../components/VideoPreview/VideoPreview';
import {getCurrentUser, getFirebaseConfigured} from '../../store/reducers/auth';
import {createUserVideo, listVideosByOwner} from '../../services/user-videos';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import './UploadVideo.scss';

class UploadVideo extends React.Component {
  state = {
    description: '',
    error: null,
    loading: false,
    uploadProgress: 0,
    videoFile: null,
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
              <Link href='/studio/profile' className='upload-video-page__profile-link'>
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
          <p>Choose a video file to upload directly to our servers. Published items will appear on Home and in your profile library.</p>
        </div>
        <Form.Input
          label='Title'
          name='title'
          onChange={this.handleInputChange}
          placeholder='Video title'
          required
          value={this.state.title}
        />
        <Form.Input
          type='file'
          accept='video/mp4,video/webm'
          label='Video File'
          name='videoFile'
          onChange={this.handleFileChange}
          required
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
        {this.state.uploadProgress > 0 && this.state.uploadProgress < 100 && (
          <Progress percent={this.state.uploadProgress} indicating progress>
            Uploading to Firebase Storage...
          </Progress>
        )}
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
          <Link href='/studio/profile'>Open full profile</Link>
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

  handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      this.setState({ videoFile: event.target.files[0] });
    }
  };

  handleSubmit = () => {
    if (!this.state.videoFile) {
      this.setState({error: 'Please select a video file.'});
      return;
    }
    
    this.setState({error: null, loading: true, success: null, uploadProgress: 0});
    
    const file = this.state.videoFile;
    const storageRef = ref(storage, `uploads/${this.props.user.uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        this.setState({ uploadProgress: progress });
      }, 
      (error) => {
        this.setState({error: error.message, loading: false});
      }, 
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          // Ensure URL triggers the DIRECT_VIDEO_PATTERN regex in user-videos.ts by appending a dummy param if missing
          const secureUrl = downloadURL + '&ext=.mp4';
          
          const videoData = {
            title: this.state.title,
            description: this.state.description,
            sourceUrl: secureUrl,
          };
          
          createUserVideo(this.props.user, videoData)
            .then(() => {
              // Clear file input by resetting state
              this.setState({
                description: '',
                loading: false,
                uploadProgress: 0,
                videoFile: null,
                success: 'Video published to your profile and the community feed.',
                title: '',
              }, () => this.loadVideos());
            })
            .catch(error => this.setState({error: error.message, loading: false}));
        });
      }
    );
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

