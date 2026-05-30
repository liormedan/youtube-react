// @ts-nocheck
import { fetchCommentThreadThunk } from '../reducers/comments';

export const thread = {
  request: (videoId, nextPageToken) => fetchCommentThreadThunk({ videoId, nextPageToken }),
};
