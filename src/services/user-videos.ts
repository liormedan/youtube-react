// @ts-nocheck
import { collection, doc, setDoc, getDocs, getDoc, query, orderBy, limit, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { firestore } from './firebase';

const DIRECT_VIDEO_PATTERN = /\.(mp4|webm|ogg)(\?.*)?$/i;

function videosCollection() {
  return firestore ? collection(firestore, 'videos') : null;
}

function userUploadsCollection(uid) {
  if (!firestore || !uid) {
    return null;
  }

  return collection(firestore, `users/${uid}/uploads`);
}

function normalizeVideoId(videoId) {
  if (!videoId) {
    return null;
  }

  return videoId.startsWith('user_') ? videoId.replace('user_', '') : videoId;
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

function toVideo(docSnapshot) {
  const data = docSnapshot.data();
  const publishedAt = data.createdAt && data.createdAt.toDate
    ? data.createdAt.toDate().toISOString()
    : new Date().toISOString();

  return {
    id: `user_${docSnapshot.id}`,
    contentDetails: {
      duration: null,
    },
    isUserVideo: true,
    management: {
      ownerUid: data.ownerUid,
      sourceType: data.sourceType,
      sourceUrl: data.sourceUrl,
      videoId: data.videoId || docSnapshot.id,
      visibility: data.visibility || 'public',
    },
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

function buildVideoPayload(user, input, overrides = {}) {
  const title = (input.title || '').trim();
  const sourceUrl = (input.sourceUrl || '').trim();
  const source = parseVideoSource(sourceUrl);

  return {
    createdAt: overrides.createdAt || serverTimestamp(),
    description: (input.description || '').trim(),
    embedUrl: source.embedUrl,
    ownerDisplayName: user.displayName || user.email || 'medan-Tube creator',
    ownerPhotoURL: user.photoURL || null,
    ownerUid: user.uid,
    sourceId: source.sourceId,
    sourceType: source.sourceType,
    sourceUrl: source.sourceUrl,
    thumbnail: source.thumbnail,
    title,
    updatedAt: serverTimestamp(),
    videoId: overrides.videoId,
    visibility: overrides.visibility || 'public',
  };
}

export function createUserVideo(user, input) {
  const collectionRef = videosCollection();
  const uploadsCollectionRef = userUploadsCollection(user && user.uid);
  if (!collectionRef || !uploadsCollectionRef || !user) {
    return Promise.reject(new Error('Firebase sign-in is required to add a video.'));
  }

  const title = (input.title || '').trim();
  const sourceUrl = (input.sourceUrl || '').trim();
  if (!title || !sourceUrl) {
    return Promise.reject(new Error('Title and video link are required.'));
  }

  const videoRef = doc(collectionRef);
  const videoPayload = buildVideoPayload(user, input, {videoId: videoRef.id});

  const batch = writeBatch(firestore);
  batch.set(videoRef, videoPayload);
  batch.set(doc(uploadsCollectionRef, videoRef.id), videoPayload);
  return batch.commit().then(() => videoRef);
}

function listVideosFromQuery(q) {
  return getDocs(q).then(snapshot => snapshot.docs.map(toVideo));
}

export function listUserVideos(limitCount = 12) {
  const collectionRef = videosCollection();
  if (!collectionRef) {
    return Promise.resolve([]);
  }

  return listVideosFromQuery(
    query(collectionRef, orderBy('createdAt', 'desc'), limit(limitCount))
  );
}

export function listVideosByOwner(uid, limitCount = 24) {
  const collectionRef = userUploadsCollection(uid);
  if (!collectionRef) {
    return Promise.resolve([]);
  }

  return listVideosFromQuery(
    query(collectionRef, orderBy('createdAt', 'desc'), limit(limitCount))
  );
}

export function updateUserVideo(user, videoId, input) {
  const normalizedVideoId = normalizeVideoId(videoId);
  const uploadsRef = userUploadsCollection(user && user.uid);
  const publicCollection = videosCollection();
  if (!uploadsRef || !publicCollection || !normalizedVideoId || !user) {
    return Promise.reject(new Error('You must be signed in to edit this upload.'));
  }

  const title = (input.title || '').trim();
  const sourceUrl = (input.sourceUrl || '').trim();
  if (!title || !sourceUrl) {
    return Promise.reject(new Error('Title and video link are required.'));
  }

  const ownerRef = doc(uploadsRef, normalizedVideoId);
  const publicRef = doc(publicCollection, normalizedVideoId);

  return getDoc(ownerRef).then((snapshot) => {
    if (!snapshot.exists()) {
      throw new Error('This upload no longer exists in your profile.');
    }

    const existing = snapshot.data();
    const payload = buildVideoPayload(user, input, {
      createdAt: existing.createdAt || serverTimestamp(),
      videoId: normalizedVideoId,
      visibility: existing.visibility || 'public',
    });

    const batch = writeBatch(firestore);
    batch.set(ownerRef, payload);
    batch.set(publicRef, payload);
    return batch.commit();
  });
}

export function deleteUserVideo(user, videoId) {
  const normalizedVideoId = normalizeVideoId(videoId);
  const uploadsRef = userUploadsCollection(user && user.uid);
  const publicCollection = videosCollection();
  if (!uploadsRef || !publicCollection || !normalizedVideoId || !user) {
    return Promise.reject(new Error('You must be signed in to delete this upload.'));
  }

  const batch = writeBatch(firestore);
  batch.delete(doc(uploadsRef, normalizedVideoId));
  batch.delete(doc(publicCollection, normalizedVideoId));
  return batch.commit();
}

export function getUserVideo(videoId) {
  const collectionRef = videosCollection();
  const normalizedVideoId = normalizeVideoId(videoId);
  if (!collectionRef || !normalizedVideoId) {
    return Promise.resolve(null);
  }

  return getDoc(doc(collectionRef, normalizedVideoId)).then(docSnapshot => {
    if (!docSnapshot.exists()) {
      return null;
    }
    return {
      ...toVideo(docSnapshot),
      id: videoId,
    };
  });
}

