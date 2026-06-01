// @ts-nocheck
import React from 'react';
import './VideoMetadata.scss';
import {Rating} from '../Rating/Rating';

export function VideoMetadata(props) {
  if (!props.video || !props.video.statistics) {
    return <div/>;
  }
  const viewCount = Number(props.video.statistics.viewCount).toLocaleString();

  return (
    <div className='video-metadata'>
      <h3>{props.video.snippet.title}</h3>
      <div className='video-stats'>
        <span>{viewCount} views</span>
        <div className='video-actions'>
          <Rating likeCount={props.video.statistics.likeCount}
                  dislikeCount={props.video.statistics.dislikeCount}/>
          <button className='video-action-button' type='button'>
            <span aria-hidden='true'>S</span>
            Share
          </button>
          <button className='video-action-button' disabled={!props.user} onClick={() => props.onSaveActivity('likedVideos')} type='button'>
            <span aria-hidden='true'>+</span>
            Like
          </button>
          <button className='video-action-button' disabled={!props.user} onClick={() => props.onSaveActivity('watchLater')} type='button'>
            <span aria-hidden='true'>W</span>
            Watch later
          </button>
        </div>
      </div>
      <hr className='video-metadata__divider'/>
    </div>
  );
}
