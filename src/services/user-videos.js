import firebase from 'firebase/app';
import {firestore} from './firebase';

const DIRECT_VIDEO_PATTERN = /\.(mp4|webm|ogg)(\?.*)?$/i;

function videosCollection() {
  return firestore ? firestore.collection('videos') : null;
}

function userUploadsCollection(uid) {
  if (!firestore || !uid) {
    return null;
  }

  return firestore.collection('users').doc(uid).collection('uploads');
}

function extractYoutubeId(url) {
  const patterns = [
    /youtu\.be\/([^?&/]+)/,
    /youtube\.com\/watch\?v=([^?&/]+)/,
    /youtube\.com\/embed\/([^?&/]+)/,
    /youtube\.com\/shorts\/([^?&/]+)/,
  ];
  const match = patterns.map(pattern => url.match(pattern)).find(Boolean);
  return match ? match[1] : null;
}

function extractDriveId(url) {
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (fileMatch) {
    return fileMatch[1];
  }

  const idMatch = url.match(/[?&]id=([^&]+)/);
  return idMatch ? idMatch[1] : null;
}

export function parseVideoSource(url) {
  const trimmedUrl = (url || '').trim();
  const youtubeId = extractYoutubeId(trimmedUrl);
  if (youtubeId) {
    return {
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
      sourceId: youtubeId,
      sourceType: 'youtube',
      sourceUrl: trimmedUrl,
      thumbnail: `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`,
    };
  }

  const driveId = extractDriveId(trimmedUrl);
  if (driveId) {
    return {
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      sourceId: driveId,
      sourceType: 'drive',
      sourceUrl: trimmedUrl,
      thumbnail: null,
    };
  }

  return {
    embedUrl: DIRECT_VIDEO_PATTERN.test(trimmedUrl) ? trimmedUrl : null,
    sourceId: null,
    sourceType: DIRECT_VIDEO_PATTERN.test(trimmedUrl) ? 'direct' : 'link',
    sourceUrl: trimmedUrl,
    thumbnail: null,
  };
}

function fallbackThumbnail(title) {
  const safeTitle = encodeURIComponent((title || 'medan-Tube').slice(0, 42));
  return `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1'%3E%3Cstop stop-color='%230ea5e9'/%3E%3Cstop offset='1' stop-color='%23bef264'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='320' height='180' rx='18' fill='url(%23g)'/%3E%3Ccircle cx='160' cy='90' r='36' fill='rgba(255,255,255,.82)'/%3E%3Cpath d='M150 70v40l34-20z' fill='%230f172a'/%3E%3Ctext x='24' y='156' font-family='Arial' font-size='18' font-weight='700' fill='%230f172a'%3E${safeTitle}%3C/text%3E%3C/svg%3E`;
}

function toVideo(doc) {
  const data = doc.data();
  const publishedAt = data.createdAt && data.createdAt.toDate
    ? data.createdAt.toDate().toISOString()
    : new Date().toISOString();

  return {
    id: `user_${doc.id}`,
    contentDetails: {
      duration: null,
    },
    isUserVideo: true,
    snippet: {
      channelId: data.ownerUid,
      channelTitle: data.ownerDisplayName || 'medan-Tube creator',
      description: data.description || '',
      embedUrl: data.embedUrl,
      externalUrl: data.sourceUrl,
      publishedAt,
      sourceType: data.sourceType,
      sourceUrl: data.sourceUrl,
      thumbnails: {
        medium: {
          url: data.thumbnail || fallbackThumbnail(data.title),
        },
      },
      title: data.title,
    },
    statistics: {
      commentCount: '0',
      likeCount: '0',
      viewCount: '0',
    },
  };
}

export function createUserVideo(user, input) {
  const collection = videosCollection();
  const uploadsCollection = userUploadsCollection(user && user.uid);
  if (!collection || !uploadsCollection || !user) {
    return Promise.reject(new Error('Firebase sign-in is required to add a video.'));
  }

  const title = (input.title || '').trim();
  const sourceUrl = (input.sourceUrl || '').trim();
  if (!title || !sourceUrl) {
    return Promise.reject(new Error('Title and video link are required.'));
  }

  const source = parseVideoSource(sourceUrl);
  const videoRef = collection.doc();
  const videoPayload = {
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    description: (input.description || '').trim(),
    embedUrl: source.embedUrl,
    ownerDisplayName: user.displayName || user.email || 'medan-Tube creator',
    ownerEmail: user.email || '',
    ownerPhotoURL: user.photoURL || null,
    ownerUid: user.uid,
    sourceId: source.sourceId,
    sourceType: source.sourceType,
    sourceUrl: source.sourceUrl,
    thumbnail: source.thumbnail,
    title,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  const batch = firestore.batch();
  batch.set(videoRef, videoPayload);
  batch.set(uploadsCollection.doc(videoRef.id), videoPayload);
  return batch.commit().then(() => videoRef);
}

function listVideosFromQuery(query) {
  return query.get().then(snapshot => snapshot.docs.map(toVideo));
}

export function listUserVideos(limit = 12) {
  const collection = videosCollection();
  if (!collection) {
    return Promise.resolve([]);
  }

  return listVideosFromQuery(
    collection
      .orderBy('createdAt', 'desc')
      .limit(limit)
  );
}

export function listVideosByOwner(uid, limit = 24) {
  const collection = userUploadsCollection(uid);
  if (!collection) {
    return Promise.resolve([]);
  }

  return listVideosFromQuery(
    collection
      .orderBy('createdAt', 'desc')
      .limit(limit)
  );
}

export function getUserVideo(videoId) {
  const collection = videosCollection();
  if (!collection || !videoId || !videoId.startsWith('user_')) {
    return Promise.resolve(null);
  }

  return collection.doc(videoId.replace('user_', '')).get().then(doc => {
    if (!doc.exists) {
      return null;
    }
    return {
      ...toVideo(doc),
      id: videoId,
    };
  });
}
