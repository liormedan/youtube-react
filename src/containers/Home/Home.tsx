import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../../store/configureStore';
import * as videoActions from '../../store/actions/video';
import './Home.scss';
import { SideBar } from '../SideBar/SideBar';
import HomeContent from './HomeContent/HomeContent';
import { getYoutubeLibraryLoaded } from '../../store/reducers/api';
import {
  getVideoCategoryIds,
  videoCategoriesLoaded,
  videosByCategoryLoaded,
} from '../../store/reducers/videos';

export default function Home() {
  const [categoryIndex, setCategoryIndex] = useState(0);
  const dispatch = useDispatch<AppDispatch>();

  const isYoutubeLibraryLoaded = useSelector(getYoutubeLibraryLoaded);
  const videoCategories = useSelector(getVideoCategoryIds);
  const isVideoCategoriesLoaded = useSelector(videoCategoriesLoaded);
  const isVideosByCategoryLoaded = useSelector(videosByCategoryLoaded);

  const fetchCategoriesAndMostPopularVideos = useCallback(() => {
    dispatch(videoActions.mostPopular.request());
    dispatch(videoActions.categories.request());
  }, [dispatch]);

  const fetchVideosByCategory = useCallback(() => {
    if (videoCategories.length === 0) return;
    const categoriesToFetch = videoCategories.slice(categoryIndex, categoryIndex + 3);
    dispatch(videoActions.mostPopularByCategory.request(categoriesToFetch));
    setCategoryIndex((prevIndex) => prevIndex + 3);
  }, [dispatch, videoCategories, categoryIndex]);

  useEffect(() => {
    if (isYoutubeLibraryLoaded) {
      fetchCategoriesAndMostPopularVideos();
    }
  }, [isYoutubeLibraryLoaded, fetchCategoriesAndMostPopularVideos]);

  // We only want to trigger the first fetch of categories when videoCategories are loaded 
  // and we haven't fetched any yet (categoryIndex === 0)
  useEffect(() => {
    if (videoCategories.length > 0 && categoryIndex === 0) {
      fetchVideosByCategory();
    }
    // Only run this effect when videoCategories are first populated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoCategories]);

  const bottomReachedCallback = useCallback(() => {
    if (!isVideoCategoriesLoaded) {
      return;
    }
    fetchVideosByCategory();
  }, [isVideoCategoriesLoaded, fetchVideosByCategory]);

  const shouldShowLoader = () => {
    if (isVideoCategoriesLoaded && isVideosByCategoryLoaded) {
      return categoryIndex < videoCategories.length;
    }
    return false;
  };

  return (
    <React.Fragment>
      <SideBar />
      <HomeContent
        bottomReachedCallback={bottomReachedCallback}
        showLoader={shouldShowLoader()}
      />
    </React.Fragment>
  );
}