'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import { SideBar } from '../../../src/containers/SideBar/SideBar';
import { VideoGrid } from '../../../src/components/VideoGrid/VideoGrid';
import { getYoutubeLibraryLoaded } from '../../../src/store/reducers/api';
import { getMostPopularVideos } from '../../../src/store/reducers/videos';
import * as videoActions from '../../../src/store/actions/video';

function normalise(value: string) {
  return decodeURIComponent(value || '').toLowerCase().replace(/\s+/g, '');
}

export default function ChannelPage() {
  const dispatch = useDispatch();
  const params = useParams();
  const rawChannelId = Array.isArray(params.channelId) ? params.channelId[0] : params.channelId;
  const channelId = decodeURIComponent(rawChannelId || '');
  const youtubeLibraryLoaded = useSelector(getYoutubeLibraryLoaded);
  const videos = useSelector(getMostPopularVideos);

  useEffect(() => {
    if (youtubeLibraryLoaded && !videos.length) {
      dispatch(videoActions.mostPopular.request(20, true));
    }
  }, [dispatch, youtubeLibraryLoaded, videos.length]);

  const channelKey = normalise(channelId);
  const channelVideos = videos.filter((video: any) => {
    const snippet = video && video.snippet ? video.snippet : {};
    return normalise(snippet.channelId || '') === channelKey || normalise(snippet.channelTitle || '') === channelKey;
  });
  const visibleVideos = channelVideos.length ? channelVideos : videos.slice(0, 12);
  const title = channelVideos.length ? channelId : `${channelId || 'Channel'} videos`;

  return (
    <React.Fragment>
      <SideBar />
      <main className='home-content'>
        <div className='responsive-video-grid-container'>
          <VideoGrid title={title} videos={visibleVideos} />
          {!visibleVideos.length && (
            <div style={{ padding: 24 }}>
              No videos found for this channel yet.
            </div>
          )}
        </div>
      </main>
    </React.Fragment>
  );
}
