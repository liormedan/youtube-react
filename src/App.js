import React, {Component} from 'react';
import Home from './containers/Home/Home';
import {AppLayout} from './components/AppLayout/AppLayout';
import {Route, Switch, withRouter} from 'react-router-dom';
import Watch from './containers/Watch/Watch';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {youtubeLibraryLoaded} from './store/actions/api';
import Trending from './containers/Trending/Trending';
import Search from './containers/Search/Search';
import {installDemoYoutubeApi} from './store/api/demo-youtube-api';
import {auth} from './services/firebase';
import {authError, authStateChanged} from './store/actions/auth';
import ActivityFeed from './containers/ActivityFeed/ActivityFeed';
import {upsertUserProfile} from './services/user-profile';
import UserVideos from './containers/UserVideos/UserVideos';

const API_KEY = process.env.REACT_APP_YT_API_KEY;

class App extends Component {
  render() {
    return (
      <AppLayout>
        <Switch>
          <Route path="/feed/trending" component={Trending}/>
          <Route path="/library/history" render={() => <ActivityFeed type='history'/>}/>
          <Route path="/library/watch-later" render={() => <ActivityFeed type='watchLater'/>}/>
          <Route path="/library/liked" render={() => <ActivityFeed type='liked'/>}/>
          <Route path="/studio/videos" component={UserVideos}/>
          <Route path="/results" render={() => <Search key={this.props.location.key}/>}/>
          <Route path="/watch" render={() => <Watch key={this.props.location.key}/>}/>
          <Route path="/" component={Home}/>
        </Switch>
      </AppLayout>
    );
  }
  componentDidMount() {
    this.loadYoutubeApi();
    this.listenForAuthState();
  }

  componentWillUnmount() {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }
  }

  loadYoutubeApi() {
    if (!API_KEY) {
      installDemoYoutubeApi();
      this.props.youtubeLibraryLoaded();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/client.js";

    script.onload = () => {
      window.gapi.load('client', () => {
        window.gapi.client.setApiKey(API_KEY);
        window.gapi.client.load('youtube', 'v3', () => {
          this.props.youtubeLibraryLoaded();
        });
      });
    };

    document.body.appendChild(script);
  }

  listenForAuthState() {
    if (!auth) {
      this.props.authStateChanged(null);
      return;
    }

    this.unsubscribeAuth = auth.onAuthStateChanged(
      user => {
        if (!user) {
          this.props.authStateChanged(null);
          return;
        }

        upsertUserProfile(user)
          .then(profile => this.props.authStateChanged(profile))
          .catch(error => this.props.authError(error.message));
      },
      error => this.props.authError(error.message)
    );
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({authError, authStateChanged, youtubeLibraryLoaded}, dispatch);
}

export default withRouter(connect(null, mapDispatchToProps)(App));
