// @ts-nocheck
'use client';
import React, { useState } from 'react';
import './HeaderNav.scss';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import AuthMenu from '../AuthMenu/AuthMenu';
import {useTheme} from '../../contexts/ThemeContext';

const soonActions = [
  {icon: 'grid layout', label: 'Apps'},
  {icon: 'chat', label: 'Messages'},
  {icon: 'alarm', label: 'Notifications'},
];

const iconGlyphs = {
  'youtube play': '▶',
  'grid layout': '#',
  chat: 'C',
  alarm: '!',
  sun: 'S',
  moon: 'M',
};

function HeaderIcon({ name, className = '' }) {
  return (
    <span aria-hidden='true' className={['header-icon-glyph', className].filter(Boolean).join(' ')}>
      {iconGlyphs[name] || '•'}
    </span>
  );
}

export function HeaderNav() {
  const [query, setQuery] = useState('');
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const onInputChange = (event) => {
    setQuery(event.target.value);
  };

  const onSubmit = () => {
    const escapedSearchQuery = encodeURI(query);
    router.push(`/results?search_query=${escapedSearchQuery}`);
  };

  return (
    <header className='top-menu'>
      <div className='logo'>
        <Link href='/' className='brand-link'>
          <HeaderIcon name='youtube play' className='brand-icon'/>
          <span>medan-Tube</span>
        </Link>
      </div>
      <div className='nav-container'>
        <div className='search-input'>
          <form onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}>
            <div className='search-form-field'>
              <input
                aria-label='Search'
                className='search-field'
                onChange={onInputChange}
                placeholder='Search'
                type='search'
                value={query}
              />
              <button className='search-button' type='submit'>
                Go
              </button>
            </div>
          </form>
        </div>
        <div className='nav-actions'>
          <div className='nav-action-item'>
            <button className='theme-toggle' onClick={toggleTheme} aria-label='Toggle theme' type='button'>
              <HeaderIcon name={theme === 'dark' ? 'sun' : 'moon'} className='header-icon' />
            </button>
          </div>
          <div className='nav-action-item'>
            <Link href='/studio/upload' className='header-action header-action--upload' aria-label='Create upload'>
              <span className='header-action__plus'>+</span>
              <span>Upload</span>
            </Link>
          </div>
          {soonActions.map(action => (
            <div className='nav-action-item' key={action.label}>
              <span className='header-action header-action--soon' aria-label={`${action.label} coming soon`}>
                <HeaderIcon className='header-icon' name={action.icon}/>
                <span>{action.label}</span>
                <span className='header-action__soon'>Soon</span>
              </span>
            </div>
          ))}
          <div className='nav-action-item nav-action-item--auth'>
            <AuthMenu/>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeaderNav;
