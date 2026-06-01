'use client';

import React, { useEffect, useState } from 'react';
import { SideBar } from '../../../src/containers/SideBar/SideBar';
import { VideoGrid } from '../../../src/components/VideoGrid/VideoGrid';
import { listUserVideos } from '../../../src/services/user-videos';

export default function FollowersPage() {
  const [videos, setVideos] = useState<any[]>([]);

  useEffect(() => {
    listUserVideos(12)
      .then(fetchedVideos => setVideos(fetchedVideos))
      .catch(() => setVideos([]));
  }, []);

  return (
    <React.Fragment>
      <SideBar />
      <main className='home-content'>
        <div className='responsive-video-grid-container'>
          <VideoGrid title='Followers feed' videos={videos} />
          {!videos.length && (
            <div style={{ padding: 24 }}>
              Follow creators and publish community uploads to build this feed.
            </div>
          )}
        </div>
      </main>
    </React.Fragment>
  );
}
