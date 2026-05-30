// @ts-nocheck
import { createSlice } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';
import { SEARCH_LIST_RESPONSE, VIDEO_LIST_RESPONSE } from '../api/youtube-api-response-types';
import { getSearchParam } from '../../services/url';
import {
  fetchVideoCategoriesThunk,
  fetchMostPopularVideosThunk,
  fetchMostPopularVideosByCategoryThunk
} from '../actions/video';
import { watchDetailsThunk, videoDetailsThunk } from '../actions/watch';

export const initialState = {
  byId: {},
  mostPopular: {},
  categories: {},
  byCategory: {},
  related: {},
};

function reduceFetchMostPopularVideos(response, state) {
  const videoMap = response.items.reduce((accumulator, video) => {
    accumulator[video.id] = video;
    return accumulator;
  }, {});

  let items = Object.keys(videoMap);
  if (response.hasOwnProperty('prevPageToken') && state.mostPopular && state.mostPopular.items) {
    items = [...state.mostPopular.items, ...items];
  }

  state.mostPopular = {
    totalResults: response.pageInfo.totalResults,
    nextPageToken: response.nextPageToken,
    items,
  };
  state.byId = { ...state.byId, ...videoMap };
}

function reduceFetchVideoCategories(response, state) {
  const categoryMapping = response.items.reduce((accumulator, category) => {
    accumulator[category.id] = category.snippet.title;
    return accumulator;
  }, {});
  state.categories = categoryMapping;
}

function reduceFetchMostPopularVideosByCategory(responses, categories, state) {
  let videoMap = {};
  let byCategoryMap = {};

  responses.forEach((response, index) => {
    if (response.error && response.error.code === 400) return;
    if (response.status === 400) return;
    if (!response.items) return;

    const categoryId = categories[index];
    const { byId, byCategory } = groupVideosByIdAndCategory(response);
    videoMap = { ...videoMap, ...byId };
    byCategoryMap[categoryId] = byCategory;
  });

  state.byId = { ...state.byId, ...videoMap };
  state.byCategory = { ...state.byCategory, ...byCategoryMap };
}

function groupVideosByIdAndCategory(response) {
  const videos = response.items;
  const byId = {};
  const byCategory = {
    totalResults: response.pageInfo.totalResults,
    nextPageToken: response.nextPageToken,
    items: [],
  };

  videos.forEach((video) => {
    byId[video.id] = video;
    byCategory.items.push(video.id);
  });

  return { byId, byCategory };
}

function reduceWatchDetails(responses, state) {
  const videoDetailResponse = responses.find(r => r.kind === VIDEO_LIST_RESPONSE);
  if (!videoDetailResponse || !videoDetailResponse.items || !videoDetailResponse.items.length) return;
  const video = videoDetailResponse.items[0];
  
  const relatedVideosResponse = responses.find(r => r.kind === SEARCH_LIST_RESPONSE);
  let relatedEntry = { totalResults: 0, nextPageToken: null, items: [] };
  if (relatedVideosResponse) {
    relatedEntry = {
      totalResults: relatedVideosResponse.pageInfo.totalResults,
      nextPageToken: relatedVideosResponse.nextPageToken,
      items: relatedVideosResponse.items.map(v => v.id.videoId)
    };
  }

  state.byId[video.id] = video;
  state.related[video.id] = relatedEntry;
}

function reduceVideoDetails(responses, state) {
  const videoResponses = responses.filter(response => response.kind === VIDEO_LIST_RESPONSE);
  videoResponses.forEach(response => {
    const video = response.items ? response.items[0] : null;
    if (video) {
      state.byId[video.id] = video;
    }
  });
}

const videosSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchMostPopularVideosThunk.fulfilled, (state, action) => {
      reduceFetchMostPopularVideos(action.payload, state);
    });
    builder.addCase(fetchVideoCategoriesThunk.fulfilled, (state, action) => {
      reduceFetchVideoCategories(action.payload, state);
    });
    builder.addCase(fetchMostPopularVideosByCategoryThunk.fulfilled, (state, action) => {
      reduceFetchMostPopularVideosByCategory(action.payload.responses, action.payload.categories, state);
    });
    builder.addCase(watchDetailsThunk.fulfilled, (state, action) => {
      const responses = action.payload.responses.map(r => r.result);
      reduceWatchDetails(responses, state);
    });
    builder.addCase(videoDetailsThunk.fulfilled, (state, action) => {
      const responses = action.payload.map(r => r.result);
      reduceVideoDetails(responses, state);
    });
  }
});


/* Selectors */
const getMostPopular = (state) => state.videos.mostPopular;
export const getMostPopularVideos = createSelector(
  (state) => state.videos.byId,
  getMostPopular,
  (videosById, mostPopular) => {
    if (!mostPopular || !mostPopular.items) {
      return [];
    }
    return mostPopular.items.map(videoId => videosById[videoId]);
  }
);

export const getVideoCategoryIds = createSelector(
  state => state.videos.categories,
  (categories) => {
    return Object.keys(categories || {});
  }
);

export const getVideosByCategory = createSelector(
  state => state.videos.byCategory,
  state => state.videos.byId,
  state => state.videos.categories,
  (videosByCategory, videosById, categories) => {
    return Object.keys(videosByCategory || {}).reduce((accumulator, categoryId) => {
      const videoIds = videosByCategory[categoryId].items;
      const categoryTitle = categories[categoryId];
      accumulator[categoryTitle] = videoIds.map(videoId => videosById[videoId]);
      return accumulator;
    }, {});
  }
);

export const videoCategoriesLoaded = createSelector(
  state => state.videos.categories,
  (categories) => {
    return Object.keys(categories || {}).length !== 0;
  }
);

export const videosByCategoryLoaded = createSelector(
  state => state.videos.byCategory,
  (videosByCategory) => {
    return Object.keys(videosByCategory || {}).length;
  }
);

export const getVideoById = (state, videoId) => {
  return state.videos.byId[videoId];
};

const getRelatedVideoIds = (state, videoId) => {
  const related = state.videos.related[videoId];
  return related ? related.items : [];
};

export const getRelatedVideos = createSelector(
  getRelatedVideoIds,
  state => state.videos.byId,
  (relatedVideoIds, videos) => {
    if (relatedVideoIds) {
      return relatedVideoIds.map(videoId => videos[videoId]).filter(video => video);
    }
    return [];
  });

export const getChannelId = (state, location, name) => {
  const videoId = getSearchParam(location, name);
  const video = state.videos.byId[videoId];
  if (video) {
    return video.snippet.channelId;
  }
  return null;
};

export const getAmountComments = createSelector(
  getVideoById,
  (video) => {
    if (video) {
      return video.statistics.commentCount;
    }
    return 0;
  });

export const allMostPopularVideosLoaded = createSelector(
  [getMostPopular],
  (mostPopular) => {
    const amountFetchedItems = mostPopular.items ? mostPopular.items.length : 0;
    return amountFetchedItems === mostPopular.totalResults;
  }
);

export const getMostPopularVideosNextPageToken = createSelector(
  [getMostPopular],
  (mostPopular) => {
    return mostPopular.nextPageToken;
  }
);

export default videosSlice.reducer;

