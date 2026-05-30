// @ts-nocheck
import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  buildVideoCategoriesRequest,
  buildMostPopularVideosRequest
} from '../api/youtube-api';

export const fetchVideoCategoriesThunk = createAsyncThunk(
  'video/categories',
  async (_, { rejectWithValue }) => {
    try {
      const request = buildVideoCategoriesRequest();
      const response = await request;
      return response.result;
    } catch (error) {
      return rejectWithValue(error.result || error);
    }
  }
);

export const fetchMostPopularVideosThunk = createAsyncThunk(
  'video/mostPopular',
  async ({ amount, loadDescription, nextPageToken }, { rejectWithValue }) => {
    try {
      const request = buildMostPopularVideosRequest(amount, loadDescription, nextPageToken);
      const response = await request;
      return response.result;
    } catch (error) {
      return rejectWithValue(error.result || error);
    }
  }
);

export const fetchMostPopularVideosByCategoryThunk = createAsyncThunk(
  'video/mostPopularByCategory',
  async (categories, { rejectWithValue }) => {
    try {
      const requests = categories.map(categoryId => {
        return buildMostPopularVideosRequest(12, false, null, categoryId)
          .then(response => response.result)
          .catch(error => error.result || error);
      });
      const responses = await Promise.all(requests);
      return { responses, categories };
    } catch (error) {
      return rejectWithValue(error.result || error);
    }
  }
);

export const categories = { request: () => fetchVideoCategoriesThunk() };
export const mostPopular = { request: (amount?: any, loadDescription?: any, nextPageToken?: any) => fetchMostPopularVideosThunk({ amount, loadDescription, nextPageToken }) };
export const mostPopularByCategory = { request: (categoriesList?: any) => fetchMostPopularVideosByCategoryThunk(categoriesList) };

