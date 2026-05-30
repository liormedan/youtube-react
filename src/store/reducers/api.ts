// @ts-nocheck
import { createSlice } from '@reduxjs/toolkit';

const apiSlice = createSlice({
  name: 'api',
  initialState: {
    libraryLoaded: false,
  },
  reducers: {
    youtubeLibraryLoaded: (state) => {
      state.libraryLoaded = true;
    },
  },
});

export const { youtubeLibraryLoaded } = apiSlice.actions;
export const getYoutubeLibraryLoaded = (state) => state.api.libraryLoaded;
export default apiSlice.reducer;
