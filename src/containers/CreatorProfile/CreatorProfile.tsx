// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { SideBar } from '../SideBar/SideBar';
import { VideoPreview } from '../../components/VideoPreview/VideoPreview';
import { getCurrentUser } from '../../store/reducers/auth';
import { auth, isFirebaseConfigured } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { authStateChanged } from '../../store/actions/auth';
import { createUserVideo, deleteUserVideo, listVideosByOwner, parseVideoSource, updateUserVideo } from '../../services/user-videos';
import { getUserProfile, updateCurrentUserProfile } from '../../services/user-profile';
import './CreatorProfile.scss';
import { AppDispatch } from '../../store/configureStore';

export default function CreatorProfile() {
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector(getCurrentUser);

  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [profileDraft, setProfileDraft] = useState({
    bio: '',
    displayName: '',
    photoURL: '',
    theme: 'light',
  });
  
  const [profileSaving, setProfileSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  
  const [videoDraft, setVideoDraft] = useState({
    description: '',
    sourceUrl: '',
    title: '',
  });
  
  const [uploadDraft, setUploadDraft] = useState({
    description: '',
    sourceUrl: '',
    title: '',
  });
  
  const [uploadSaving, setUploadSaving] = useState(false);
  const [videoSaving, setVideoSaving] = useState(false);
  const [videoSuccess, setVideoSuccess] = useState<string | null>(null);
  const [videos, setVideos] = useState<any[]>([]);

  const loadProfile = useCallback(() => {
    if (!user) {
      setError(null);
      setLoading(false);
      setProfile(null);
      setVideos([]);
      return;
    }

    setError(null);
    setLoading(true);
    Promise.all([
      getUserProfile(user.uid),
      listVideosByOwner(user.uid, 50),
    ])
      .then(([fetchedProfile, fetchedVideos]) => {
        setLoading(false);
        setProfile(fetchedProfile);
        setProfileDraft({
          bio: fetchedProfile?.bio || '',
          displayName: fetchedProfile?.displayName || user.displayName || '',
          photoURL: fetchedProfile?.photoURL || user.photoURL || '',
          theme: fetchedProfile?.theme || user.theme || 'light',
        });
        setVideos(fetchedVideos);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSignOut = () => {
    signOut(auth);
  };

  const setTheme = (theme: string) => {
    setProfileDraft(prev => ({ ...prev, theme }));
    setProfileSuccess(null);
  };

  const handleProfileDraftChange = (event: any) => {
    const { name, value } = event.target;
    setProfileDraft(prev => ({ ...prev, [name]: value }));
    setProfileSuccess(null);
  };

  const handleUploadDraftChange = (event: any) => {
    const { name, value } = event.target;
    setUploadDraft(prev => ({ ...prev, [name]: value }));
    setVideoSuccess(null);
  };

  const handleVideoDraftChange = (event: any) => {
    const { name, value } = event.target;
    setVideoDraft(prev => ({ ...prev, [name]: value }));
    setVideoSuccess(null);
  };

  const handleProfileSubmit = (event: any) => {
    event.preventDefault();
    setError(null);
    setProfileSaving(true);
    setProfileSuccess(null);
    
    updateCurrentUserProfile(profileDraft)
      .then((updatedProfile) => {
        dispatch(authStateChanged(updatedProfile));
        setProfile(updatedProfile);
        setProfileSaving(false);
        setProfileSuccess('Profile updated. Your private profile document now reflects the new values.');
        loadProfile();
      })
      .catch(err => {
        setError(err.message);
        setProfileSaving(false);
      });
  };

  const handleCreateVideoSubmit = (event: any) => {
    event.preventDefault();
    setError(null);
    setUploadSaving(true);
    setVideoSuccess(null);
    
    createUserVideo(user, uploadDraft)
      .then(() => {
        setUploadDraft({ description: '', sourceUrl: '', title: '' });
        setUploadSaving(false);
        setVideoSuccess('Link published to your profile and the public feed.');
        loadProfile();
      })
      .catch(err => {
        setError(err.message);
        setUploadSaving(false);
      });
  };

  const startEditingVideo = (video: any) => {
    setEditingVideoId(video.id);
    setVideoDraft({
      description: video.snippet.description || '',
      sourceUrl: video.snippet.sourceUrl || '',
      title: video.snippet.title || '',
    });
    setVideoSuccess(null);
  };

  const cancelEditingVideo = () => {
    setEditingVideoId(null);
    setVideoDraft({ description: '', sourceUrl: '', title: '' });
  };

  const handleVideoSubmit = (event: any) => {
    event.preventDefault();
    setError(null);
    setVideoSaving(true);
    setVideoSuccess(null);
    
    updateUserVideo(user, editingVideoId, videoDraft)
      .then(() => {
        setEditingVideoId(null);
        setVideoDraft({ description: '', sourceUrl: '', title: '' });
        setVideoSaving(false);
        setVideoSuccess('Upload updated across your private profile and the public feed.');
        loadProfile();
      })
      .catch(err => {
        setError(err.message);
        setVideoSaving(false);
      });
  };

  const handleDeleteVideo = (videoId: string) => {
    setError(null);
    setVideoSuccess(null);
    
    deleteUserVideo(user, videoId)
      .then(() => {
        if (editingVideoId === videoId) setEditingVideoId(null);
        setVideoSuccess('Upload deleted from your private profile and the public feed.');
        loadProfile();
      })
      .catch(err => setError(err.message));
  };

  const providerLabel = (providerId: string) => {
    if (providerId === 'google.com') return 'Google';
    if (providerId === 'password') return 'Email and password';
    return providerId || 'Firebase Auth';
  };

  const renderSourceTypeBadge = (sourceType: string) => {
    const labels: any = {
      direct: 'Direct video URL',
      drive: 'Google Drive',
      link: 'External link',
      youtube: 'YouTube',
    };
    return (
      <span className={`creator-profile-page__source-label creator-profile-page__source-label--${sourceType || 'link'}`}>
        {labels[sourceType] || labels.link}
      </span>
    );
  };

  const renderSourceBadge = (video: any) => {
    const sourceType = video.management?.sourceType || video.snippet.sourceType || 'link';
    return (
      <div className='creator-profile-page__video-badge'>
        {renderSourceTypeBadge(sourceType)}
      </div>
    );
  };

  const renderConnectionCard = (currentProfile: any, providerId: string) => (
    <div className='creator-profile-page__panel creator-profile-page__connection'>
      <div className='creator-profile-page__panel-heading'>
        <h3>Account connection</h3>
        <p>Your profile is tied to the signed-in Firebase account.</p>
      </div>
      <div className='creator-profile-page__connection-grid'>
        <div>
          <span>Email</span>
          <strong>{currentProfile.email || user.email || 'No email'}</strong>
        </div>
        <div>
          <span>Provider</span>
          <strong>{providerLabel(providerId)}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>Connected</strong>
        </div>
      </div>
      <button className='creator-profile-page__button creator-profile-page__button--ghost' onClick={handleSignOut} type='button'>
        Sign out
      </button>
    </div>
  );

  const renderProfileForm = () => (
    <form className='creator-profile-page__panel' onSubmit={handleProfileSubmit}>
      <div className='creator-profile-page__panel-heading'>
        <h3>Private profile settings</h3>
        <p>Only you can read and update this profile document. Public upload cards use your display name and avatar snapshot.</p>
      </div>
      <label className='creator-profile-page__field'>
        <span>Display name</span>
        <input name='displayName' onChange={handleProfileDraftChange} value={profileDraft.displayName} />
      </label>
      <label className='creator-profile-page__field'>
        <span>Avatar URL</span>
        <input name='photoURL' onChange={handleProfileDraftChange} value={profileDraft.photoURL} />
      </label>
      <label className='creator-profile-page__field'>
        <span>Bio</span>
        <textarea name='bio' onChange={handleProfileDraftChange} value={profileDraft.bio} />
      </label>
      <div className='creator-profile-page__theme-control'>
        <div>
          <h4>Interface theme</h4>
          <p>Saved to your account and applied after every sign in.</p>
        </div>
        <div className='creator-profile-page__theme-buttons' role='group' aria-label='Interface theme'>
          <button
            className={`creator-profile-page__button ${profileDraft.theme === 'light' ? 'creator-profile-page__button--active' : 'creator-profile-page__button--ghost'}`}
            onClick={() => setTheme('light')}
            type='button'>
            Light
          </button>
          <button
            className={`creator-profile-page__button ${profileDraft.theme === 'dark' ? 'creator-profile-page__button--active' : 'creator-profile-page__button--ghost'}`}
            onClick={() => setTheme('dark')}
            type='button'>
            Dark
          </button>
        </div>
      </div>
      <button className='creator-profile-page__cta' disabled={profileSaving} type='submit'>{profileSaving ? 'Saving...' : 'Save profile'}</button>
    </form>
  );

  const renderUploadManager = () => {
    const source = parseVideoSource(uploadDraft.sourceUrl);
    return (
      <form className='creator-profile-page__panel' onSubmit={handleCreateVideoSubmit}>
        <div className='creator-profile-page__panel-heading'>
          <h3>Publish a link</h3>
          <p>Manage link-based uploads from your profile. Storage uploads are not supported yet.</p>
        </div>
        <div className='creator-profile-page__message creator-profile-page__message--info'>
          medan-Tube does not store uploaded files right now. Publish public YouTube links, public Google Drive links, or direct video URLs. Google Drive files must be shared with anyone who has the link.
        </div>
        <label className='creator-profile-page__field'>
          <span>Title</span>
          <input name='title' onChange={handleUploadDraftChange} placeholder='Video title' required value={uploadDraft.title} />
        </label>
        <label className='creator-profile-page__field'>
          <span>Video, Drive, or public media link</span>
          <input name='sourceUrl' onChange={handleUploadDraftChange} placeholder='https://youtu.be/... or https://drive.google.com/file/d/...' required value={uploadDraft.sourceUrl} />
        </label>
        <div className='creator-profile-page__source-preview'>
          <span>Detected source</span>
          {renderSourceTypeBadge(source.sourceType)}
        </div>
        <label className='creator-profile-page__field'>
          <span>Description</span>
          <textarea name='description' onChange={handleUploadDraftChange} placeholder='Tell viewers what this upload is about' value={uploadDraft.description} />
        </label>
        <button className='creator-profile-page__cta' disabled={uploadSaving} type='submit'>{uploadSaving ? 'Publishing...' : 'Publish link'}</button>
      </form>
    );
  };

  const renderVideoEditor = () => (
    <form className='creator-profile-page__panel creator-profile-page__panel--video' onSubmit={handleVideoSubmit}>
      <div className='creator-profile-page__panel-heading'>
        <h3>Edit upload</h3>
        <p>Changes update your private upload library and the public site feed together.</p>
      </div>
      <label className='creator-profile-page__field'>
        <span>Title</span>
        <input name='title' onChange={handleVideoDraftChange} required value={videoDraft.title} />
      </label>
      <label className='creator-profile-page__field'>
        <span>Video link</span>
        <input name='sourceUrl' onChange={handleVideoDraftChange} required value={videoDraft.sourceUrl} />
      </label>
      <div className='creator-profile-page__source-preview'>
        <span>Detected source</span>
        {renderSourceTypeBadge(parseVideoSource(videoDraft.sourceUrl).sourceType)}
      </div>
      <label className='creator-profile-page__field'>
        <span>Description</span>
        <textarea name='description' onChange={handleVideoDraftChange} value={videoDraft.description} />
      </label>
      <div className='creator-profile-page__editor-actions'>
        <button className='creator-profile-page__cta' disabled={videoSaving} type='submit'>{videoSaving ? 'Saving...' : 'Save upload'}</button>
        <button className='creator-profile-page__button creator-profile-page__button--ghost' onClick={cancelEditingVideo} type='button'>Cancel</button>
      </div>
    </form>
  );

  const renderContent = () => {
    if (!isFirebaseConfigured) {
      return <div className='creator-profile-page__message'>Firebase is not configured yet. Add your project values to .env.local.</div>;
    }

    if (!user) {
      return <div className='creator-profile-page__message'>Sign in to view your creator profile.</div>;
    }

    const currentProfile = profile || user;
    const avatar = currentProfile.photoURL || user.photoURL;
    const providerId = currentProfile.providerId || user.providerId || 'password';

    return (
      <React.Fragment>
        <div className='creator-profile-page__hero'>
          <div className='creator-profile-page__identity'>
            {avatar ? <img className='ui avatar image creator-profile-page__avatar' src={avatar} alt="Avatar" /> : <div className='creator-profile-page__avatar creator-profile-page__avatar--placeholder'/>}
            <div>
              <span className='creator-profile-page__eyebrow'>Creator profile</span>
              <h2>{currentProfile.displayName || currentProfile.email || 'Profile and studio settings'}</h2>
              <p>{currentProfile.email || 'Signed-in creator account'}</p>
            </div>
          </div>
          <div className='creator-profile-page__hero-actions'>
            <span className='creator-profile-page__status'>
              Connected
            </span>
            <Link href='/studio/upload'>
              <span className='creator-profile-page__cta'>Quick upload</span>
            </Link>
          </div>
        </div>

        {renderConnectionCard(currentProfile, providerId)}
        {renderProfileForm()}
        <div className='creator-profile-page__stats'>
          <div className='creator-profile-page__stat'>
            <span>Uploads</span>
            <strong>{videos.length}</strong>
          </div>
          <div className='creator-profile-page__stat'>
            <span>Profile status</span>
            <strong>{videos.length ? 'Active' : 'Ready to publish'}</strong>
          </div>
          <div className='creator-profile-page__stat'>
            <span>Interface</span>
            <strong>{profileDraft.theme === 'dark' ? 'Dark' : 'Light'}</strong>
          </div>
        </div>

        {error && <div className='creator-profile-page__message creator-profile-page__message--error'>{error}</div>}
        {profileSuccess && <div className='creator-profile-page__message creator-profile-page__message--success'>{profileSuccess}</div>}
        {videoSuccess && <div className='creator-profile-page__message creator-profile-page__message--success'>{videoSuccess}</div>}

        {renderUploadManager()}
        <div className='creator-profile-page__list'>
          <div className='creator-profile-page__list-heading'>
            <h3>Your uploads</h3>
            <span>{loading ? 'Loading...' : `${videos.length} item${videos.length === 1 ? '' : 's'}`}</span>
          </div>
          {!loading && !videos.length && (
            <div className='creator-profile-page__message'>
              No uploads yet. Start with <Link href='/studio/upload'>your first publish</Link>.
            </div>
          )}
          {videos.map(video => (
            <div className='creator-profile-page__video-item' key={video.id}>
              {renderSourceBadge(video)}
              <VideoPreview
                expanded={true}
                horizontal={true}
                pathname='/watch'
                search={`?v=${video.id}`}
                video={video}
              />
              <div className='creator-profile-page__video-actions'>
                <button className='creator-profile-page__button creator-profile-page__button--ghost' onClick={() => startEditingVideo(video)} type='button'>Edit</button>
                <button className='creator-profile-page__button creator-profile-page__button--danger' onClick={() => handleDeleteVideo(video.id)} type='button'>Delete</button>
              </div>
              {editingVideoId === video.id && renderVideoEditor()}
            </div>
          ))}
        </div>
      </React.Fragment>
    );
  };

  return (
    <React.Fragment>
      <SideBar/>
      <div className='creator-profile-page'>
        {renderContent()}
      </div>
    </React.Fragment>
  );
}
