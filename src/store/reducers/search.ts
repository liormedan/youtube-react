// @ts-nocheck
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { buildSearchRequest } from '../api/youtube-api';

export const searchForVideosThunk = createAsyncThunk(
  'search/forVideos',
  async ({ searchQuery, nextPageToken, amount }, { rejectWithValue }) => {
    try {
      const request = buildSearchRequest(searchQuery, nextPageToken, amount);
      const response = await request;
      return {
        response: response.result,
        searchQuery
      };
    } catch (error) {
      return rejectWithValue(error.result || error);
    }
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState: {},
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(searchForVideosThunk.pending, (state, action) => {
        const { nextPageToken } = action.meta.arg;
        if (!nextPageToken) {
          // Reset if it's a new search
          return {};
        }
      })
      .addCase(searchForVideosThunk.fulfilled, (state, action) => {
        const { response, searchQuery } = action.payload;
        let searchResults = response.items.map(item => ({...item, id: item.id.videoId}));
        if (state.query === searchQuery) {
          const prevResults = state.results || [];
          searchResults = prevResults.concat(searchResults);
        }
        return {
          totalResults: response.pageInfo.totalResults,
          nextPageToken: response.nextPageToken,
          query: searchQuery,
          results: searchResults
        };
      });
  }
});

export const getSearchResults = (state) => state.search.results;
export const getSearchNextPageToken = (state) => state.search.nextPageToken;

export default searchSlice.reducer;

