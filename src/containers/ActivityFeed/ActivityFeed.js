import React from 'react';
import {Message} from 'semantic-ui-react';
import {connect} from 'react-redux';
import {SideBar} from '../SideBar/SideBar';
import {InfiniteScroll} from '../../components/InfiniteScroll/InfiniteScroll';
import {VideoPreview} from '../../components/VideoPreview/VideoPreview';
import {getCurrentUser, getFirebaseConfigured} from '../../store/reducers/auth';
import {listUserActivity} from '../../services/user-activity';
import './ActivityFeed.scss';

const activityConfig = {
  history: {
    collection: 'history',
    empty: 'Videos you watch will appear here.',
    title: 'History',
  },
  liked: {
    collection: 'likedVideos',
    empty: 'Videos you like will appear here.',
    title: 'Liked videos',
  },
  watchLater: {
    collection: 'watchLater',
    empty: 'Videos you save for later will appear here.',
    title: 'Watch later',
  },
};

class ActivityFeed extends React.Component {
  state = {
    error: null,
    loading: false,
    videos: [],
  };

  componentDidMount() {
    this.loadActivity();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.user !== this.props.user || prevProps.type !== this.props.type) {
      this.loadActivity();
    }
  }

  render() {
    const config = this.getConfig();

    if (!this.props.firebaseConfigured) {
      return this.renderMessage('Firebase is not configured yet. Add your project values to .env.local.');
    }

    if (!this.props.user) {
      return this.renderMessage('Sign in to view your saved activity.');
    }

    return (
      <React.Fragment>
        <SideBar/>
        <div className='activity-feed'>
          <h2>{config.title}</h2>
          {this.state.error && <Message error>{this.state.error}</Message>}
          {!this.state.loading && !this.state.videos.length && <Message>{config.empty}</Message>}
          <InfiniteScroll showLoader={this.state.loading}>
            {this.renderVideos()}
          </InfiniteScroll>
        </div>
      </React.Fragment>
    );
  }

  renderMessage(message) {
    const config = this.getConfig();

    return (
      <React.Fragment>
        <SideBar/>
        <div className='activity-feed'>
          <h2>{config.title}</h2>
          <Message>{message}</Message>
        </div>
      </React.Fragment>
    );
  }

  getConfig() {
    return activityConfig[this.props.type] || activityConfig.history;
  }

  loadActivity() {
    if (!this.props.firebaseConfigured || !this.props.user) {
      this.setState({videos: [], loading: false, error: null});
      return;
    }

    const config = this.getConfig();
    this.setState({loading: true, error: null});
    listUserActivity(this.props.user.uid, config.collection)
      .then(videos => this.setState({videos, loading: false}))
      .catch(error => this.setState({error: error.message, loading: false}));
  }

  renderVideos() {
    return this.state.videos.map(video => (
      <VideoPreview
        expanded={true}
        horizontal={true}
        key={video.id}
        pathname='/watch'
        search={`?v=${video.id}`}
        video={video}
      />
    ));
  }
}

function mapStateToProps(state) {
  return {
    firebaseConfigured: getFirebaseConfigured(state),
    user: getCurrentUser(state),
  };
}

export default connect(mapStateToProps)(ActivityFeed);
