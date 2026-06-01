// @ts-nocheck
import React from 'react';
import './CommentsHeader.scss';

export function CommentsHeader(props) {
  return (
    <div className='comments-header'>
      <h4>{props.amountComments} Comments</h4>
      <button className='comments-header__sort' type='button'>
        <span aria-hidden='true'>S</span>
        Sort by
      </button>
    </div>
  );
}
