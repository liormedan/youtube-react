import React, { useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Video } from '../../../components/Video/Video';
import { VideoMetadata } from '../../../components/VideoMetadata/VideoMetadata';
import { VideoInfoBox } from '../../../components/VideoInfoBox/VideoInfoBox';
import { Comments } from '../../Comments/Comments';
import { RelatedVideos } from '../../../components/RelatedVideos/RelatedVideos';
import './WatchContent.scss';
import { getAmountComments, getRelatedVideos, getVideoById } from '../../../store/reducers/videos';
import { getChannel } from '../../../store/reducers/channels';
import { getCommentsForVideo } from '../../../store/reducers/comments';
import { InfiniteScroll } from '../../../components/InfiniteScroll/InfiniteScroll';
import { getCurrentUser } from '../../../store/reducers/auth';
import { saveVideoActivity, saveWatchHistory } from '../../../services/user-activity';
import { RootState } from '../../../store/configureStore';

interface WatchContentProps {
  videoId: string | null;
  channelId: string | null;
  customVideo: any | null;
  bottomReachedCallback: () => void;
  nextPageToken: string | null;
}

export default function WatchContent({ 
  videoId, 
  channelId, 
  customVideo, 
  bottomReachedCallback, 
  nextPageToken 
}: WatchContentProps) {
  
  const user = useSelector(getCurrentUser);
  
  // @ts-ignore
  const storeRelatedVideos = useSelector((state: RootState) => getRelatedVideos(state, videoId));
  // @ts-ignore
  const storeVideo = useSelector((state: RootState) => getVideoById(state, videoId));
  // @ts-ignore
  const storeChannel = useSelector((state: RootState) => getChannel(state, channelId));
  // @ts-ignore
  const comments = useSelector((state: RootState) => getCommentsForVideo(state, videoId));
  // @ts-ignore
  const amountComments = useSelector((state: RootState) => getAmountComments(state, videoId));

  const customChannel = customVideo ? {
    snippet: {
      thumbnails: {
        medium: {
          url: customVideo.snippet.thumbnails.medium.url,
        },
      },
      title: customVideo.snippet.channelTitle,
    },
    statistics: {
      subscriberCount: '0',
    },
  } : null;

  const video = customVideo || storeVideo;
  const channel = customChannel || storeChannel;
  const relatedVideos = storeRelatedVideos;

  const saveHistoryEntry = useCallback(() => {
    if (user && video) {
      saveWatchHistory(user.uid, video);
    }
  }, [user, video]);

  useEffect(() => {
    saveHistoryEntry();
  }, [saveHistoryEntry]);

  const onSaveActivity = useCallback((type: string) => {
    if (user && video) {
      saveVideoActivity(user.uid, type, video);
    }
  }, [user, video]);

  if (!videoId) {
    return <div />;
  }

  const shouldShowLoader = !!nextPageToken;

  return (
    <InfiniteScroll bottomReachedCallback={bottomReachedCallback} showLoader={shouldShowLoader}>
      <div className='watch-grid'>
        <Video className='video' id={videoId} video={video} />
        <VideoMetadata
          className='metadata'
          onSaveActivity={onSaveActivity}
          user={user}
          video={video}
        />
        <VideoInfoBox className='video-info-box' video={video} channel={channel} />
        <RelatedVideos className='related-videos' videos={relatedVideos} />
        <Comments className='comments' comments={comments} amountComments={amountComments} />
      </div>
    </InfiniteScroll>
  );
}
