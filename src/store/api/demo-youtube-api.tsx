// @ts-nocheck
const channelId = 'demo-channel';

const videos = [
  ['dQw4w9WgXcQ', 'Demo: Music launch trailer', 'medan-Tube Music'],
  ['M7lc1UVf-VE', 'Demo: YouTube player API walkthrough', 'Google Developers'],
  ['ysz5S6PUM-U', 'Demo: Building a React video feed', 'Frontend Lab'],
  ['jNQXAC9IVRw', 'Demo: First upload on YouTube', 'Archive Channel'],
  ['ScMzIvxBSi4', 'Demo: Creative coding session', 'Design Systems'],
  ['aqz-KE-bpKQ', 'Demo: Video quality sample', 'Open Media'],
  ['kJQP7kiw5Fk', 'Demo: Global music video', 'MusicChannel'],
  ['9bZkp7q19f0', 'Demo: Trending dance video', 'Trending Now'],
  ['hTWKbfoikeg', 'Demo: Classic live performance', 'Live Vault'],
  ['3JZ_D3ELwOQ', 'Demo: Pop culture replay', 'Replay Channel'],
  ['L_jWHffIx5E', 'Demo: Alternative playlist', 'MusicChannel'],
  ['e-ORhEE9VVg', 'Demo: Production breakdown', 'Studio Daily'],
].map(([id, title, channelTitle], index) => ({
  id,
  contentDetails: {
    duration: `PT${3 + index}M${(index * 7) % 60}S`,
  },
  snippet: {
    channelId,
    channelTitle,
    description: 'Local demo content shown because REACT_APP_YT_API_KEY is not configured.',
    publishedAt: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
    thumbnails: {
      medium: {
        url: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
      },
    },
    title,
  },
  statistics: {
    commentCount: String(35 + index * 8),
    dislikeCount: String(2 + index),
    likeCount: String(540 + index * 91),
    viewCount: String(25000 + index * 18500),
  },
}));

const categories = [
  ['10', 'Music'],
  ['20', 'Gaming'],
  ['22', 'People & Blogs'],
  ['24', 'Entertainment'],
  ['27', 'Education'],
  ['28', 'Science & Technology'],
];

const channel = {
  id: channelId,
  snippet: {
    description: 'A local demo channel used while the YouTube Data API key is missing.',
    thumbnails: {
      medium: {
        url: 'https://i.ytimg.com/vi/M7lc1UVf-VE/mqdefault.jpg',
      },
    },
    title: 'medan-Tube Demo Channel',
  },
  statistics: {
    subscriberCount: '125000',
  },
};

export function installDemoYoutubeApi() {
  window.gapi = {
    client: {
      request: ({path, params = {}}) => Promise.resolve({
        result: buildDemoResponse(path, params),
      }),
    },
  };
}

function buildDemoResponse(path, params) {
  if (path === '/youtube/v3/videoCategories') {
    return {
      kind: 'youtube#videoCategoryListResponse',
      items: categories.map(([id, title]) => ({id, snippet: {title}})),
    };
  }

  if (path === '/youtube/v3/videos') {
    const items = params.id
      ? videos.filter(video => params.id.split(',').includes(video.id))
      : videosByCategory(params.videoCategoryId).slice(0, Number(params.maxResults || 12));

    return {
      kind: 'youtube#videoListResponse',
      pageInfo: {totalResults: videos.length},
      items,
    };
  }

  if (path === '/youtube/v3/channels') {
    return {
      kind: 'youtube#channelListResponse',
      items: [channel],
    };
  }

  if (path === '/youtube/v3/search') {
    const query = (params.q || '').toLowerCase();
    const filteredVideos = query
      ? videos.filter(video => video.snippet.title.toLowerCase().includes(query) || video.snippet.channelTitle.toLowerCase().includes(query))
      : videos.filter(video => video.id !== params.relatedToVideoId);

    return {
      kind: 'youtube#searchListResponse',
      pageInfo: {totalResults: filteredVideos.length},
      items: filteredVideos.slice(0, Number(params.maxResults || 12)).map(video => ({
        ...video,
        id: {videoId: video.id},
      })),
    };
  }

  if (path === '/youtube/v3/commentThreads') {
    return {
      kind: 'youtube#commentThreadListResponse',
      items: [1, 2, 3].map(index => ({
        id: `${params.videoId || 'demo'}-comment-${index}`,
        snippet: {
          topLevelComment: {
            snippet: {
              authorDisplayName: `Demo Viewer ${index}`,
              authorProfileImageUrl: 'https://i.ytimg.com/vi/M7lc1UVf-VE/mqdefault.jpg',
              likeCount: index * 4,
              publishedAt: new Date(Date.now() - index * 3600000).toISOString(),
              textDisplay: 'This is a local demo comment for previewing the watch page.',
            },
          },
          totalReplyCount: 0,
        },
      })),
    };
  }

  return {kind: 'youtube#emptyResponse', items: [], pageInfo: {totalResults: 0}};
}

function videosByCategory(categoryId) {
  if (!categoryId) {
    return videos;
  }

  const offset = categories.findIndex(([id]) => id === categoryId);
  return videos.slice(offset).concat(videos.slice(0, offset));
}

