import React from 'react';
import './Video.scss';

const BASE_EMBED_URL = 'https://www.youtube.com/embed/';

export function Video(props) {
  if(!props.id) {
    return null;
  }

  const snippet = props.video ? props.video.snippet : {};
  const sourceType = snippet.sourceType;
  const embedUrl = snippet.embedUrl || `${BASE_EMBED_URL}${props.id}`;

  if (sourceType === 'direct') {
    return (
      <div className='video-container'>
        <div className="video">
          <video className='video-player' src={embedUrl} controls title='video'/>
        </div>
      </div>
    );
  }

  if (sourceType === 'link' && snippet.externalUrl) {
    return (
      <div className='video-container'>
        <div className="video video-link-placeholder">
          <a href={snippet.externalUrl} target='_blank' rel='noopener noreferrer'>Open video link</a>
        </div>
      </div>
    );
  }

  return (
    <div className='video-container'>
      <div className="video">
        <iframe className='video-player' src={embedUrl} frameBorder='0'
                allow='autoplay; encrypted-media' allowFullScreen title='video' />
      </div>

    </div>
  );
}
