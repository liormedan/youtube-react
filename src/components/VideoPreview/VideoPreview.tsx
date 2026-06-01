// @ts-nocheck
import React from 'react';
import './VideoPreview.scss';

import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import {getShortNumberString} from '../../services/number/number-format';
import {getVideoDurationString} from '../../services/date/date-format';
import Link from 'next/link';

TimeAgo.locale(en);
const timeAgo = new TimeAgo('en-US');

export class VideoPreview extends React.Component {
  render() {
    const {video} = this.props;
    if (!video) {
      return <div/>;
    }

    const duration = video.contentDetails ? video.contentDetails.duration : null;
    const videoDuration = getVideoDurationString(duration);
    const viewAndTimeString = VideoPreview.getFormattedViewAndTime(video);
    const horizontal = this.props.horizontal ? 'horizontal' : null;
    const expanded = this.props.expanded ? 'expanded' : null;
    const description = this.props.expanded ? video.snippet.description : null;

    return (
      <Link href={`${this.props.pathname || ''}${this.props.search || ''}`}>
        <div className={['video-preview', horizontal, expanded].join(' ')}>
          <div className='image-container'>
            <img alt={video.snippet.title} className='video-preview__image' src={video.snippet.thumbnails.medium.url}/>
            <div className='time-label'>
              <span>{videoDuration}</span>
            </div>
          </div>

          <div className='video-info'>
            <div className={['semi-bold', 'show-max-two-lines', expanded].join(' ')}>{video.snippet.title}</div>
            <div className='video-preview-metadata-container'>
              <div className='channel-title'>{video.snippet.channelTitle}</div>
              <div className='view-and-time'>{viewAndTimeString}</div>
              <div className='show-max-two-lines'>{description}</div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  static getFormattedViewAndTime(video) {
    const publicationDate = new Date(video.snippet.publishedAt);
    const viewCount = video.statistics ? video.statistics.viewCount : null;
    if(viewCount) {
      const viewCountShort = getShortNumberString(video.statistics.viewCount);
      return `${viewCountShort} views \u2022 ${timeAgo.format(publicationDate)}`;
    }
    return '';
  }
}
