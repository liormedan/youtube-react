'use client';
import React from 'react';
import './AppLayout.scss';
import HeaderNav from '../../containers/HeaderNav/HeaderNav';

import {useTheme} from '../../contexts/ThemeContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayoutComponent(props: AppLayoutProps) {
  const { theme } = useTheme() as any;
  const className = `app-layout app-layout--${theme}`;

  return (
    <div className={className}>
      <HeaderNav/>
      {props.children}
    </div>
  );
}

export const AppLayout = AppLayoutComponent;
