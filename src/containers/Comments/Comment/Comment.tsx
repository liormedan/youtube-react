// @ts-nocheck
import React from 'react';
import './Comment.scss';
import {Rating} from '../../../components/Rating/Rating';

export function Comment(props) {
  if (!props.comment) {
    return <div/>;
  }
  const topLevelComment = props.comment.snippet.topLevelComment;
  const {authorProfileImageUrl, authorDisplayName, textOriginal, textDisplay} = topLevelComment.snippet;
  const likeCount = topLevelComment.snippet.likeCount;

  return (
    <div className='comment'>
      <img className='user-image' src={authorProfileImageUrl} alt={authorDisplayName} />
      <div>
        <div className='user-name'>{authorDisplayName}</div>
        <span>{textOriginal || textDisplay}</span>
        <div className='comment-actions'>
          <Rating likeCount={likeCount}/>
          <button className='comment-reply-button' type='button'>REPLY</button>
        </div>
      </div>
    </div>
  );
}
