// @ts-nocheck
import { collection, doc, setDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { firestore } from './firebase';

function userActivityCollection(uid, collectionName) {
  if (!firestore || !uid) {
    return null;
  }
  return collection(firestore, `users/${uid}/${collectionName}`);
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
    updatedAt: serverTimestamp(),
  };
}

function fromVideoActivity(snapshotDoc) {
  const data = snapshotDoc.data();
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
  const historyCol = userActivityCollection(uid, 'history');
  if (!historyCol || !video || !video.id || !video.snippet) {
    return Promise.resolve();
  }

  const docRef = doc(historyCol, video.id);
  return setDoc(docRef, {
    ...toVideoActivity(video),
    watchedAt: serverTimestamp(),
  }, { merge: true });
}

export function saveVideoActivity(uid, type, video) {
  const col = userActivityCollection(uid, type);
  if (!col || !video || !video.id || !video.snippet) {
    return Promise.resolve();
  }

  const docRef = doc(col, video.id);
  return setDoc(docRef, toVideoActivity(video), { merge: true });
}

export function listUserActivity(uid, type) {
  const col = userActivityCollection(uid, type);
  if (!col) {
    return Promise.resolve([]);
  }

  const q = query(col, orderBy(type === 'history' ? 'watchedAt' : 'updatedAt', 'desc'), limit(50));
  return getDocs(q)
    .then(snapshot => snapshot.docs.map(fromVideoActivity))
    .catch(error => {
      if (error && error.code === 'permission-denied') {
        return [];
      }
      throw error;
    });
}
