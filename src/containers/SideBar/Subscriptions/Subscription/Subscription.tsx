// @ts-nocheck
import React from 'react';
import Link from 'next/link';
import './Subscription.scss';

export function Subscription(props) {
  let rightElement = null;
  const {broadcasting, amountNewVideos} = props;
  if (broadcasting) {
    rightElement = <span className='subscription__signal' aria-hidden='true'>LIVE</span>;
  } else if (amountNewVideos) {
    rightElement = <span className='new-videos-count'>{amountNewVideos}</span>;
  }

  const href = `/channel/${encodeURIComponent(props.channelId || props.label || '')}`;

  return (
    <Link className='subscription' href={href}>
      <div className='subscription__main'>
        <span className='subscription__avatar' aria-hidden='true'>{String(props.label || '?').charAt(0).toUpperCase()}</span>
        <div>
          <span>{props.label}</span>
        </div>
      </div>
      {rightElement}
    </Link>
  );
}
