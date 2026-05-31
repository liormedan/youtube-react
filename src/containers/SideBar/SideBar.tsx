// @ts-nocheck
import React from 'react';
import SideBarItem from './SideBarItem/SideBarItem';
import './SideBar.scss';
import {SideBarHeader} from './SideBarHeader/SideBarHeader';
import {Subscriptions} from './Subscriptions/Subscriptions';
import {SideBarFooter} from './SideBarFooter/SideBarFooter';

export class SideBar extends React.Component {
  render() {
    return (
      <aside className='side-nav'>
        <SideBarItem path='/' label='Home' icon='home'/>
        <SideBarItem path='/feed/trending' label='Trending' icon='fire'/>
        <SideBarItem label='Followers' icon='spy'/>
        <hr className='side-nav__divider'/>
        <SideBarHeader title='Library'/>
        <SideBarItem path='/library/history' label='History' icon='history'/>
        <SideBarItem path='/library/watch-later' label='Watch later' icon='clock'/>
        <SideBarItem path='/library/liked' label='Liked videos' icon='thumbs up'/>
        <SideBarItem path='/studio/upload' label='New upload' icon='plus circle'/>
        <SideBarItem path='/studio/profile' label='My profile' icon='user circle'/>
        <hr className='side-nav__divider'/>
        <Subscriptions/>
        <SideBarHeader title='More from medan-Tube'/>
        <SideBarItem label='Movies and Shows' icon='film'/>
        <hr className='side-nav__divider'/>
        <SideBarItem label='Report history' icon='flag'/>
        <SideBarItem label='Help' icon='help circle'/>
        <SideBarItem label='Send feedback' icon='comment'/>
        <hr className='side-nav__divider'/>
        <SideBarFooter/>
      </aside>
    );
  }
}
