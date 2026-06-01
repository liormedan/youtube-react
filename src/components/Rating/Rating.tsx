// @ts-nocheck
import React from 'react';
import './Rating.scss';
import {getShortNumberString} from '../../services/number/number-format';

export function Rating(props) {
  let rating = null;
  let likeCount = props.likeCount !== 0 ? props.likeCount : null;
  let dislikeCount = null;

  if(props.likeCount && props.dislikeCount) {
    const amountLikes = parseFloat(props.likeCount);
    const amountDislikes = parseFloat(props.dislikeCount);
    const percentagePositiveRatings = 100.0 * (amountLikes / (amountLikes + amountDislikes));

    likeCount = getShortNumberString(amountLikes);
    dislikeCount = getShortNumberString(amountDislikes);
    rating = (
      <div className='rating__bar'>
        <span style={{width: `${percentagePositiveRatings}%`}} />
      </div>
    );
  }
  return (
    <div className='rating'>
      <div>
        <span className='rating__icon' aria-hidden='true'>+</span>
        <span>{likeCount}</span>
      </div>
      <div>
        <span className='rating__icon' aria-hidden='true'>-</span>
        <span>{dislikeCount}</span>
      </div>
      {rating}
    </div>
  );
}
