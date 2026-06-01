'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../src/services/firebase';
import { getUserVideo, approveUserVideo } from '../../../src/services/user-videos';
import { Video } from '../../../src/components/Video/Video';
import '../../../src/containers/Watch/WatchContent/WatchContent.scss'; // Import video styles

const ADMIN_EMAILS = ['liormedan1@gmail.com', 'medan4u@gmail.com'];

function AdminShell({ children }: { children: React.ReactNode }) {
  return <main style={{ margin: '2em auto', maxWidth: 980, padding: '1em' }}>{children}</main>;
}

function AdminMessage({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'error' | 'success' }) {
  const colours = {
    error: { background: '#fef2f2', border: '#fecaca', color: '#991b1b' },
    info: { background: '#f8fafc', border: '#e2e8f0', color: '#0f172a' },
    success: { background: '#f0fdf4', border: '#bbf7d0', color: '#166534' },
  }[type];

  return (
    <div style={{ background: colours.background, border: `1px solid ${colours.border}`, borderRadius: 12, color: colours.color, marginBottom: 18, padding: '14px 16px' }}>
      {children}
    </div>
  );
}

function ApproveContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoId = searchParams.get('videoId');

  const [user, setUser] = useState(null);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && videoId) {
        if (!ADMIN_EMAILS.includes(currentUser.email)) {
          setError('Access Denied. You are not an authorized administrator.');
          setLoading(false);
          return;
        }

        getUserVideo(videoId)
          .then((vid) => {
            if (!vid) {
              setError('Video not found or already deleted.');
            } else {
              setVideo(vid);
            }
          })
          .catch((err) => setError(err.message))
          .finally(() => setLoading(false));
      } else if (!currentUser) {
        setError('Please sign in to approve videos.');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [videoId]);

  const handleApprove = () => {
    setLoading(true);
    approveUserVideo(videoId)
      .then(() => {
        setSuccess(true);
        setTimeout(() => router.push('/'), 2000);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  if (loading) {
    return <AdminShell><AdminMessage>Loading...</AdminMessage></AdminShell>;
  }

  if (error) {
    return (
      <AdminShell>
        <AdminMessage type='error'><strong>Error</strong><br />{error}</AdminMessage>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div>
        <h2>Review Pending Video</h2>
        {success ? (
          <AdminMessage type='success'><strong>Success</strong><br />Video has been approved and is now public! Redirecting...</AdminMessage>
        ) : (
          <div>
            <div className='watch-content'>
              <Video id={videoId} video={video} />
            </div>
            <div style={{ marginTop: '1em' }}>
              <h3>{video.snippet.title}</h3>
              <p><strong>Description:</strong> {video.snippet.description}</p>
              <p><strong>Owner UID:</strong> {video.management.ownerUid}</p>
            </div>
            <button
              disabled={loading}
              onClick={handleApprove}
              style={{ background: '#32aee8', border: 0, borderRadius: 10, color: '#0f172a', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 800, marginTop: '2em', minHeight: 44, padding: '12px 18px' }}
            >
              {loading ? 'Approving...' : 'Approve & Publish Video'}
            </button>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

export default function AdminApprovePage() {
  return (
    <React.Suspense fallback={<AdminShell><AdminMessage>Loading...</AdminMessage></AdminShell>}>
      <ApproveContent />
    </React.Suspense>
  );
}
