// @ts-nocheck
import React from 'react';
import './NextUpVideo.scss';
import {VideoPreview} from '../../VideoPreview/VideoPreview';

export function NextUpVideo(props) {
  return (
    <React.Fragment>
      <div className='next-up-container'>
        <h4>Up next</h4>
        <label className='up-next-toggle'>
          <span>Autoplay</span>
          <input type='checkbox' defaultChecked />
        </label>
      </div>
      <VideoPreview horizontal={true} video={props.video} pathname='/watch' search={`?v=${props.video.id}`}/>
      <hr className='next-up-divider'/>
    </React.Fragment>
  );
}
