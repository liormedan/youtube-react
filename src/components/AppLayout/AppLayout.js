import React from 'react';
import './AppLayout.scss';
import HeaderNav from '../../containers/HeaderNav/HeaderNav';
import ScrollToTop from '../ScrollToTop/ScrollToTop';
import {connect} from 'react-redux';
import {getCurrentUser} from '../../store/reducers/auth';

export function AppLayoutComponent(props) {
  const theme = props.user && props.user.theme === 'dark' ? 'dark' : 'light';
  const className = `app-layout app-layout--${theme}`;

  return (
    <ScrollToTop>
      <div className={className}>
        <HeaderNav/>
        {props.children}
      </div>
    </ScrollToTop>
  );
}

function mapStateToProps(state) {
  return {
    user: getCurrentUser(state),
  };
}

export const AppLayout = connect(mapStateToProps)(AppLayoutComponent);
