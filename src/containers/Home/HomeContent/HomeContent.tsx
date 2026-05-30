import { VideoGrid } from '../../../components/VideoGrid/VideoGrid';
import React, { useState, useEffect } from 'react';
import './HomeContent.scss';
import { getMostPopularVideos, getVideosByCategory } from '../../../store/reducers/videos';
import { useSelector } from 'react-redux';
import { InfiniteScroll } from '../../../components/InfiniteScroll/InfiniteScroll';
import { listUserVideos } from '../../../services/user-videos';

const AMOUNT_TRENDING_VIDEOS = 12;

interface HomeContentProps {
  bottomReachedCallback: () => void;
  showLoader: boolean;
}

export default function HomeContent({ bottomReachedCallback, showLoader }: HomeContentProps) {
  const [userVideos, setUserVideos] = useState<any[]>([]);

  const videosByCategory = useSelector(getVideosByCategory);
  const mostPopularVideos = useSelector(getMostPopularVideos);

  useEffect(() => {
    listUserVideos(8)
      .then(videos => setUserVideos(videos))
      .catch(() => setUserVideos([]));
  }, []);

  const trendingVideos = mostPopularVideos.slice(0, AMOUNT_TRENDING_VIDEOS);
  
  const categoryTitles = Object.keys(videosByCategory || {});
  const categoryGrids = categoryTitles.map((categoryTitle, index) => {
    const videos = videosByCategory[categoryTitle];
    const hideDivider = index === categoryTitles.length - 1;
    return (
      <VideoGrid 
        title={categoryTitle} 
        videos={videos} 
        key={categoryTitle} 
        hideDivider={hideDivider} 
      />
    );
  });

  return (
    <div className='home-content'>
      <div className="responsive-video-grid-container">
        <InfiniteScroll bottomReachedCallback={bottomReachedCallback} showLoader={showLoader}>
          <VideoGrid title='Community uploads' videos={userVideos} />
          <VideoGrid title='Trending' videos={trendingVideos} />
          {categoryGrids}
        </InfiniteScroll>
      </div>
    </div>
  );
}
