// @ts-nocheck
'use client';
import React, { useState } from 'react';
import {Form, Icon, Input, Menu} from 'semantic-ui-react';
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
    <Menu borderless className='top-menu' fixed='top'>
      <Menu.Item header className='logo'>
        <Link href='/' className='brand-link'>
          <Icon name='youtube play' className='brand-icon'/>
          <span>medan-Tube</span>
        </Link>
      </Menu.Item>
      <Menu.Menu className='nav-container'>
        <Menu.Item className='search-input'>
          <Form onSubmit={onSubmit}>
            <Form.Field>
              <Input placeholder='Search'
                     size='small'
                     action='Go'
                     value={query}
                     onChange={onInputChange}
              />
            </Form.Field>
          </Form>
        </Menu.Item>
        <Menu.Menu position='right'>
          <Menu.Item>
            <div className='theme-toggle' onClick={toggleTheme} aria-label='Toggle theme' style={{ cursor: 'pointer', padding: '0 10px' }}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size='large' className='header-icon' style={{ margin: 0 }} />
            </div>
          </Menu.Item>
          <Menu.Item>
            <Link href='/studio/upload' className='header-action header-action--upload' aria-label='Create upload'>
              <span className='header-action__plus'>+</span>
              <span>Upload</span>
            </Link>
          </Menu.Item>
          {soonActions.map(action => (
            <Menu.Item key={action.label}>
              <span className='header-action header-action--soon' aria-label={`${action.label} coming soon`}>
                <Icon className='header-icon' name={action.icon}/>
                <span>{action.label}</span>
                <span className='header-action__soon'>Soon</span>
              </span>
            </Menu.Item>
          ))}
          <Menu.Item name='auth'>
            <AuthMenu/>
          </Menu.Item>
        </Menu.Menu>
      </Menu.Menu>
    </Menu>
  );
}

export default HeaderNav;

