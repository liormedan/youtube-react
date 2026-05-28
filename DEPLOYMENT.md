# medan-Tube deployment

This project is configured to run without a YouTube Data API key. If
`REACT_APP_YT_API_KEY` is empty, the app uses local demo video data while Firebase
Auth, Firestore profiles, history, liked videos, and watch later remain active.

## Required Firebase setup

Enable these Firebase services in the `medan-tube` project:

- Authentication: Email/Password
- Authentication: Google
- Firestore Database
- Hosting

Use these Firestore rules:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }

    match /users/{uid} {
      allow read, create, update: if isOwner(uid);
      allow delete: if false;

      match /{collectionName}/{docId} {
        allow read, create, update, delete: if isOwner(uid);
      }
    }
  }
}
```

## Local env

Create `.env.local` from `.env.example` and fill the Firebase values. Leave
`REACT_APP_YT_API_KEY` empty for now.

```env
REACT_APP_YT_API_KEY=
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
```

Restart the dev server after changing env values.

## Verify locally

```powershell
npm start
npm run build
npm test -- --watchAll=false --updateSnapshot
```

## Deploy

After Firebase CLI is authenticated and linked to the `medan-tube` project:

```powershell
npm run deploy:firestore
npm run deploy:hosting
```

Use full deploy when both hosting and Firestore rules should be deployed:

```powershell
npm run deploy
```
