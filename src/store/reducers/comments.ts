// @ts-nocheck
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';
import { getSearchParam } from '../../services/url';
import { buildCommentThreadRequest } from '../api/youtube-api';
import { COMMENT_THREAD_LIST_RESPONSE } from '../api/youtube-api-response-types';

export const fetchCommentThreadThunk = createAsyncThunk(
  'comments/fetchCommentThread',
  async ({ videoId, nextPageToken }, { rejectWithValue }) => {
    try {
      const request = buildCommentThreadRequest(videoId, nextPageToken);
      const response = await request;
      return { response: response.result, videoId };
    } catch (error) {
      return rejectWithValue(error.result || error);
    }
  }
);

const initialState = {
  byVideo: {},
  byId: {},
};

function reduceCommentThreadState(response, videoId, state) {
  if (!response) {
    return;
  }
  const newComments = response.items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  const prevCommentIds = state.byVideo[videoId] ? state.byVideo[videoId].ids : [];
  const commentIds = Array.from(new Set([...prevCommentIds, ...Object.keys(newComments)]));

  const byVideoComment = {
    nextPageToken: response.nextPageToken,
    ids: commentIds,
  };

  state.byId = { ...state.byId, ...newComments };
  state.byVideo[videoId] = byVideoComment;
}

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchCommentThreadThunk.fulfilled, (state, action) => {
      reduceCommentThreadState(action.payload.response, action.payload.videoId, state);
    });
    // Listen to watch details thunk
    builder.addCase('watch/details/fulfilled', (state, action) => {
      const { responses, videoId } = action.payload;
      const commentThreadResponse = responses.find(res => res.result.kind === COMMENT_THREAD_LIST_RESPONSE);
      if (commentThreadResponse) {
        reduceCommentThreadState(commentThreadResponse.result, videoId, state);
      }
    });
  }
});

export const getCommentIdsForVideo = (state, videoId) => {
  const comment = state.comments.byVideo[videoId];
  if (comment) {
    return comment.ids;
  }
  return [];
};

export const getCommentsForVideo = createSelector(
  getCommentIdsForVideo,
  state => state.comments.byId,
  (commentIds, allComments) => {
    return commentIds.map(commentId => allComments[commentId]);
  }
);

const getComment = (state, location) => {
  const videoId = getSearchParam(location, 'v');
  return state.comments.byVideo[videoId];
};

export const getCommentNextPageToken = createSelector(
  getComment,
  (comment) => {
    return comment ? comment.nextPageToken : null;
  }
);

export default commentsSlice.reducer;
