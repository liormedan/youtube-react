'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Message, Container } from 'semantic-ui-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../src/services/firebase';
import { getUserVideo, approveUserVideo } from '../../../src/services/user-videos';
import { Video } from '../../../src/components/Video/Video';
import '../../../src/containers/Watch/WatchContent/WatchContent.scss'; // Import video styles

const ADMIN_EMAILS = ['liormedan1@gmail.com', 'medan4u@gmail.com'];

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
    return <Container style={{ marginTop: '2em' }}><Message>Loading...</Message></Container>;
  }

  if (error) {
    return (
      <Container style={{ marginTop: '2em' }}>
        <Message error header="Error" content={error} />
      </Container>
    );
  }

  return (
    <Container style={{ marginTop: '2em', padding: '1em' }}>
      <div>
        <h2>Review Pending Video</h2>
        {success ? (
          <Message success header="Success" content="Video has been approved and is now public! Redirecting..." />
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
            <Button 
              primary 
              size='large' 
              onClick={handleApprove} 
              loading={loading}
              style={{ marginTop: '2em' }}
            >
              Approve & Publish Video
            </Button>
          </div>
        )}
      </div>
    </Container>
  );
}

export default function AdminApprovePage() {
  return (
    <React.Suspense fallback={<Container style={{ marginTop: '2em' }}><Message>Loading...</Message></Container>}>
      <ApproveContent />
    </React.Suspense>
  );
}
