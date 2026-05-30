// @ts-nocheck
import apiReducer from './api';
import {combineReducers} from 'redux';
import videosReducer from './videos'
import channelsReducer from './channels';
import commentsReducer from './comments';
import searchReducer from './search';
import authReducer from './auth';

export default combineReducers({
  api: apiReducer,
  auth: authReducer,
  videos: videosReducer,
  channels: channelsReducer,
  comments: commentsReducer,
  search: searchReducer
});

