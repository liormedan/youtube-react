// @ts-nocheck
import React from 'react';
import './AddComment.scss';

export function AddComment() {
  return (
    <div className='add-comment'>
      <div className='user-image add-comment__avatar' aria-hidden='true'>U</div>
      <form>
        <textarea placeholder='Add a public comment' rows={2} />
      </form>
    </div>
  );
}
