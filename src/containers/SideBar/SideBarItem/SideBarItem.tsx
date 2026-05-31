// @ts-nocheck
'use client';
import React from 'react';
import './SideBarItem.scss';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const iconGlyphs = {
  home: 'H',
  fire: 'T',
  spy: 'F',
  history: 'R',
  clock: 'W',
  'thumbs up': 'L',
  'plus circle': '+',
  'user circle': 'U',
  film: 'M',
  flag: '!',
  'help circle': '?',
  comment: 'C',
};

export function SideBarItem(props) {
  const pathname = usePathname();

  const shouldBeHighlighted = () => {
    if (!pathname) return false;
    if (props.path === '/') {
      return pathname === props.path;
    }
    return props.path ? pathname.includes(props.path) : false;
  };

  const highlight = shouldBeHighlighted() ? 'highlight-item' : null;
  return (
    <Link className={['sidebar-item', highlight].filter(Boolean).join(' ')} href={props.path || '/'}>
      <div className='sidebar-item__body'>
        <div className='sidebar-item-alignment-container'>
          <span className='sidebar-item__icon' aria-hidden='true'>{iconGlyphs[props.icon] || '•'}</span>
          <span>{props.label}</span>
        </div>
      </div>
    </Link>
  );
}

export default SideBarItem;
