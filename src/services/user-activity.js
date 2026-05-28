import firebase from 'firebase/app';
import {firestore} from './firebase';

function userActivityCollection(uid, collectionName) {
  if (!firestore || !uid) {
    return null;
  }
  return firestore.collection('users').doc(uid).collection(collectionName);
}

function toVideoActivity(video) {
  return {
    channelId: video.snippet.channelId || null,
    channelTitle: video.snippet.channelTitle || '',
    description: video.snippet.description || '',
    duration: video.contentDetails ? video.contentDetails.duration : null,
    likeCount: video.statistics ? video.statistics.likeCount : null,
    thumbnail: video.snippet.thumbnails.medium.url,
    title: video.snippet.title,
    videoId: video.id,
    viewCount: video.statistics ? video.statistics.viewCount : null,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
}

function fromVideoActivity(doc) {
  const data = doc.data();
  const publishedAt = data.watchedAt || data.updatedAt;

  return {
    id: data.videoId,
    contentDetails: {
      duration: data.duration,
    },
    snippet: {
      channelId: data.channelId,
      channelTitle: data.channelTitle,
      description: data.description,
      publishedAt: publishedAt && publishedAt.toDate ? publishedAt.toDate().toISOString() : new Date().toISOString(),
      thumbnails: {
        medium: {
          url: data.thumbnail,
        },
      },
      title: data.title,
    },
    statistics: {
      likeCount: data.likeCount,
      viewCount: data.viewCount,
    },
  };
}

export function saveWatchHistory(uid, video) {
  const history = userActivityCollection(uid, 'history');
  if (!history || !video || !video.id || !video.snippet) {
    return Promise.resolve();
  }

  return history.doc(video.id).set({
    ...toVideoActivity(video),
    watchedAt: firebase.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});
}

export function saveVideoActivity(uid, type, video) {
  const collection = userActivityCollection(uid, type);
  if (!collection || !video || !video.id || !video.snippet) {
    return Promise.resolve();
  }

  return collection.doc(video.id).set(toVideoActivity(video), {merge: true});
}

export function listUserActivity(uid, type) {
  const collection = userActivityCollection(uid, type);
  if (!collection) {
    return Promise.resolve([]);
  }

  return collection
    .orderBy(type === 'history' ? 'watchedAt' : 'updatedAt', 'desc')
    .limit(50)
    .get()
    .then(snapshot => snapshot.docs.map(fromVideoActivity));
}
