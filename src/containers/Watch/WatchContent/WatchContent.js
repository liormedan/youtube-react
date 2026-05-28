import React from 'react';
import {Video} from '../../../components/Video/Video';
import {VideoMetadata} from '../../../components/VideoMetadata/VideoMetadata';
import {VideoInfoBox} from '../../../components/VideoInfoBox/VideoInfoBox';
import {Comments} from '../../Comments/Comments';
import {RelatedVideos} from '../../../components/RelatedVideos/RelatedVideos';
import './WatchContent.scss';
import {getAmountComments, getRelatedVideos, getVideoById} from '../../../store/reducers/videos';
import {connect} from 'react-redux';
import {getChannel} from '../../../store/reducers/channels';
import {getCommentsForVideo} from '../../../store/reducers/comments';
import {InfiniteScroll} from '../../../components/InfiniteScroll/InfiniteScroll';
import {getCurrentUser} from '../../../store/reducers/auth';
import {saveVideoActivity, saveWatchHistory} from '../../../services/user-activity';

class WatchContent extends React.Component {
  componentDidMount() {
    this.saveHistoryEntry();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.video !== this.props.video || prevProps.user !== this.props.user) {
      this.saveHistoryEntry();
    }
  }

  render() {
    if (!this.props.videoId) {
      return <div/>
    }
    return (
      <InfiniteScroll bottomReachedCallback={this.props.bottomReachedCallback} showLoader={this.shouldShowLoader()}>
        <div className='watch-grid'>
          <Video className='video' id={this.props.videoId} video={this.props.video}/>
          <VideoMetadata
            className='metadata'
            onSaveActivity={this.onSaveActivity}
            user={this.props.user}
            video={this.props.video}/>
          <VideoInfoBox className='video-info-box' video={this.props.video} channel={this.props.channel}/>
          <RelatedVideos className='related-videos' videos={this.props.relatedVideos}/>
          <Comments className='comments' comments={this.props.comments}  amountComments={this.props.amountComments}/>
        </div>
      </InfiniteScroll>
    );
  }
  shouldShowLoader() {
    return !!this.props.nextPageToken;
  }

  saveHistoryEntry() {
    if (this.props.user && this.props.video) {
      saveWatchHistory(this.props.user.uid, this.props.video);
    }
  }

  onSaveActivity = (type) => {
    if (this.props.user && this.props.video) {
      saveVideoActivity(this.props.user.uid, type, this.props.video);
    }
  };
}

function mapStateToProps(state, props) {
  const customChannel = props.customVideo ? {
    snippet: {
      thumbnails: {
        medium: {
          url: props.customVideo.snippet.thumbnails.medium.url,
        },
      },
      title: props.customVideo.snippet.channelTitle,
    },
    statistics: {
      subscriberCount: '0',
    },
  } : null;

  return {
    relatedVideos: getRelatedVideos(state, props.videoId),
    video: props.customVideo || getVideoById(state, props.videoId),
    channel: customChannel || getChannel(state, props.channelId),
    comments: getCommentsForVideo(state, props.videoId),
    amountComments: getAmountComments(state, props.videoId),
    user: getCurrentUser(state),
  }
}

export default connect(mapStateToProps, null)(WatchContent);
