// @ts-nocheck
import { searchForVideosThunk } from '../reducers/search';

export const forVideos = {
  request: (searchQuery?: any, nextPageToken?: any, amount?: any) => searchForVideosThunk({ searchQuery, nextPageToken, amount }),
};
