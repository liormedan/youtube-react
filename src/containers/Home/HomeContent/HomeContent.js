import {VideoGrid} from '../../../components/VideoGrid/VideoGrid';
import React from 'react';
import './HomeContent.scss';
import {getMostPopularVideos, getVideosByCategory} from '../../../store/reducers/videos';
import {connect} from 'react-redux';
import {InfiniteScroll} from '../../../components/InfiniteScroll/InfiniteScroll';
import {listUserVideos} from '../../../services/user-videos';

const AMOUNT_TRENDING_VIDEOS = 12;

export class HomeContent extends React.Component {
  state = {
    userVideos: [],
  };

  componentDidMount() {
    listUserVideos(8)
      .then(userVideos => this.setState({userVideos}))
      .catch(() => this.setState({userVideos: []}));
  }

  render() {
    const trendingVideos = this.getTrendingVideos();
    const categoryGrids = this.getVideoGridsForCategories();

    return (
      <div className='home-content'>
        <div className="responsive-video-grid-container">
          <InfiniteScroll bottomReachedCallback={this.props.bottomReachedCallback} showLoader={this.props.showLoader}>
            <VideoGrid title='Community uploads' videos={this.state.userVideos}/>
            <VideoGrid title='Trending' videos={trendingVideos}/>
            {categoryGrids}
          </InfiniteScroll>
        </div>
      </div>
    );
  }

  getTrendingVideos() {
    return this.props.mostPopularVideos.slice(0, AMOUNT_TRENDING_VIDEOS);
  }

  getVideoGridsForCategories() {
    const categoryTitles = Object.keys(this.props.videosByCategory || {});
    return categoryTitles.map((categoryTitle,index) => {
      const videos = this.props.videosByCategory[categoryTitle];
      // the last video grid element should not have a divider
      const hideDivider = index === categoryTitles.length - 1;
      return <VideoGrid title={categoryTitle} videos={videos} key={categoryTitle} hideDivider={hideDivider}/>;
    });
  }
}

function mapStateToProps(state) {
  return {
    videosByCategory: getVideosByCategory(state),
    mostPopularVideos: getMostPopularVideos(state),
  };
}
export default connect(mapStateToProps, null)(HomeContent);
