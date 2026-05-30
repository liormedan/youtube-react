// @ts-nocheck
import { createSlice } from '@reduxjs/toolkit';
import { CHANNEL_LIST_RESPONSE } from '../api/youtube-api-response-types';

const initialState = {
  byId: {}
};

function reduceChannelState(responses, state) {
  const channelResponse = responses.find(response => response.result.kind === CHANNEL_LIST_RESPONSE);
  let channelEntry = {};
  if (channelResponse && channelResponse.result.items && channelResponse.result.items.length) {
    const channel = channelResponse.result.items[0];
    channelEntry = { [channel.id]: channel };
  }
  state.byId = { ...state.byId, ...channelEntry };
}

const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase('watch/details/fulfilled', (state, action) => {
      reduceChannelState(action.payload.responses, state);
    });
    builder.addCase('watch/videoDetails/fulfilled', (state, action) => {
      reduceChannelState(action.payload, state);
    });
  }
});

export const getChannel = (state, channelId) => {
  if (!channelId) return null;
  return state.channels.byId[channelId];
};

export default channelsSlice.reducer;
