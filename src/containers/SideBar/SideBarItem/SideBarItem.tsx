// @ts-nocheck
'use client';
import React from 'react';
import {Icon, Menu} from "semantic-ui-react";
import './SideBarItem.scss';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SideBarItem(props) {
  const pathname = usePathname();

  const shouldBeHighlighted = () => {
    if (!pathname) return false;
    if (props.path === '/') {
      return pathname === props.path;
    }
    return pathname.includes(props.path);
  };

  const highlight = shouldBeHighlighted() ? 'highlight-item' : null;
  return (
    <Link href={props.path || '/'}>
      <Menu.Item className={['sidebar-item', highlight].join(' ')}>
        <div className='sidebar-item-alignment-container'>
          <span><Icon size='large' name={props.icon}/> </span>
          <span>{props.label}</span>
        </div>
      </Menu.Item>
    </Link>
  );
}

export default SideBarItem;
