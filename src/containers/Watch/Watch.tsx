import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/configureStore';
import * as watchActions from '../../store/actions/watch';
import { getYoutubeLibraryLoaded } from '../../store/reducers/api';
import WatchContent from './WatchContent/WatchContent';
import { getSearchParam } from '../../services/url';
import { getChannelId } from '../../store/reducers/videos';
import { getCommentNextPageToken } from '../../store/reducers/comments';
import * as commentActions from '../../store/actions/comment';
import { getUserVideo } from '../../services/user-videos';

interface WatchProps {
  location: { search: string };
  history: { push: (url: string) => void };
}

export default function Watch({ location, history }: WatchProps) {
  const [customVideo, setCustomVideo] = useState<any>(null);
  const dispatch = useDispatch<AppDispatch>();

  const isYoutubeLibraryLoaded = useSelector(getYoutubeLibraryLoaded);
  
  // Connect selectors directly using the location prop
  // @ts-ignore
  const channelId = useSelector((state: RootState) => getChannelId(state, location, 'v'));
  // @ts-ignore
  const nextPageToken = useSelector((state: RootState) => getCommentNextPageToken(state, location));

  const getVideoId = useCallback(() => {
    return getSearchParam(location, 'v');
  }, [location]);

  const fetchWatchContent = useCallback(() => {
    const videoId = getVideoId();
    if (!videoId) {
      history.push('/');
      return;
    }
    if (videoId.startsWith('user_')) {
      getUserVideo(videoId).then(video => setCustomVideo(video));
      return;
    }
    setCustomVideo(null);
    dispatch(watchActions.details.request(videoId, channelId));
  }, [dispatch, getVideoId, history, channelId]);

  useEffect(() => {
    if (isYoutubeLibraryLoaded) {
      fetchWatchContent();
    }
  }, [isYoutubeLibraryLoaded, fetchWatchContent]);

  const fetchMoreComments = useCallback(() => {
    if (nextPageToken) {
      dispatch(commentActions.thread.request(getVideoId(), nextPageToken));
    }
  }, [dispatch, nextPageToken, getVideoId]);

  const videoId = getVideoId();

  return (
    <WatchContent 
      videoId={videoId} 
      channelId={channelId} 
      customVideo={customVideo} 
      bottomReachedCallback={fetchMoreComments}
      nextPageToken={nextPageToken} 
    />
  );
}
