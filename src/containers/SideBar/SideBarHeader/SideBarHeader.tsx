// @ts-nocheck
import React from 'react';
import './SideBarHeader.scss';

export function SideBarHeader(props) {
  const heading = props.title ? props.title.toUpperCase() : '';
  return (
    <div className='side-bar-header'>{heading}</div>
  );
}
