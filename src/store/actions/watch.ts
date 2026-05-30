// @ts-nocheck
import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  buildVideoDetailRequest,
  buildRelatedVideosRequest,
  buildChannelRequest,
  buildCommentThreadRequest
} from '../api/youtube-api';
import { SEARCH_LIST_RESPONSE, VIDEO_LIST_RESPONSE } from '../api/youtube-api-response-types';

export const videoDetailsThunk = createAsyncThunk(
  'watch/videoDetails',
  async ({ responses, shouldFetchChannelInfo }, { rejectWithValue }) => {
    try {
      const searchListResponse = responses.find(response => response.kind === SEARCH_LIST_RESPONSE);
      if (!searchListResponse) return [];
      
      const relatedVideoIds = searchListResponse.items.map(relatedVideo => relatedVideo.id.videoId);
      
      const requests = relatedVideoIds.map(relatedVideoId => {
        return buildVideoDetailRequest(relatedVideoId);
      });

      if (shouldFetchChannelInfo) {
        const videoDetailResponse = responses.find(response => response.kind === VIDEO_LIST_RESPONSE);
        if (videoDetailResponse && videoDetailResponse.items && videoDetailResponse.items.length) {
          requests.push(buildChannelRequest(videoDetailResponse.items[0].snippet.channelId));
        }
      }

      const rawResponses = await Promise.all(requests);
      return rawResponses.map(r => {
        // Redux slices currently expect `response.result.kind` structure for compatibility 
        // because the original saga returned full GAPI response objects.
        return { result: r.result };
      });
    } catch (error) {
      return rejectWithValue(error.result || error);
    }
  }
);

export const watchDetailsThunk = createAsyncThunk(
  'watch/details',
  async ({ videoId, channelId }, { dispatch, rejectWithValue }) => {
    try {
      let requests = [
        buildVideoDetailRequest(videoId),
        buildRelatedVideosRequest(videoId),
        buildCommentThreadRequest(videoId)
      ];

      if (channelId) {
        requests.push(buildChannelRequest(channelId));
      }

      const rawResponses = await Promise.all(requests);
      // Map to { result } wrapper for backwards compatibility with reducers
      const responses = rawResponses.map(r => ({ result: r.result }));
      
      dispatch(videoDetailsThunk({ responses: responses.map(r => r.result), shouldFetchChannelInfo: channelId === undefined || channelId === null }));
      
      return { responses, videoId };
    } catch (error) {
      return rejectWithValue(error.result || error);
    }
  }
);

export const details = {
  request: (videoId, channelId) => watchDetailsThunk({ videoId, channelId })
};
export const videoDetails = {
  request: () => { throw Error('not implemented'); }
};
