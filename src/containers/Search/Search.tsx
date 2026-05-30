import React, { useEffect, useCallback } from 'react';
import './Search.scss';
import { getYoutubeLibraryLoaded } from '../../store/reducers/api';
import { getSearchNextPageToken, getSearchResults } from '../../store/reducers/search';
import * as searchActions from '../../store/actions/search';
import { useDispatch, useSelector } from 'react-redux';
import { getSearchParam } from '../../services/url';
import { VideoList } from '../../components/VideoList/VideoList';
import { AppDispatch, RootState } from '../../store/configureStore';

interface SearchProps {
  location: { search: string };
  history: { push: (url: string) => void };
}

export default function Search({ location, history }: SearchProps) {
  const dispatch = useDispatch<AppDispatch>();

  const youtubeApiLoaded = useSelector(getYoutubeLibraryLoaded);
  const searchResults = useSelector((state: RootState) => getSearchResults(state));
  const nextPageToken = useSelector((state: RootState) => getSearchNextPageToken(state));

  const getSearchQuery = useCallback(() => {
    return getSearchParam(location, 'search_query');
  }, [location]);

  const searchForVideos = useCallback(() => {
    const searchQuery = getSearchQuery();
    if (youtubeApiLoaded && searchQuery) {
      dispatch(searchActions.forVideos.request(searchQuery));
    }
  }, [youtubeApiLoaded, getSearchQuery, dispatch]);

  useEffect(() => {
    const searchQuery = getSearchQuery();
    if (!searchQuery) {
      // redirect to home component if search query is not there
      history.push('/');
    } else {
      searchForVideos();
    }
  }, [getSearchQuery, history, searchForVideos]);

  const bottomReachedCallback = useCallback(() => {
    if (nextPageToken) {
      const searchQuery = getSearchQuery();
      if (searchQuery) {
        dispatch(searchActions.forVideos.request(searchQuery, nextPageToken, 25));
      }
    }
  }, [dispatch, nextPageToken, getSearchQuery]);

  return (
    <VideoList
      bottomReachedCallback={bottomReachedCallback}
      showLoader={true}
      videos={searchResults}
    />
  );
}
