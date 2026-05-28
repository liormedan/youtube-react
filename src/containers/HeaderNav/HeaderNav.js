import React from 'react';
import {Form, Icon, Input, Menu} from 'semantic-ui-react';
import './HeaderNav.scss';
import {Link, withRouter} from 'react-router-dom';
import AuthMenu from '../AuthMenu/AuthMenu';

const soonActions = [
  {icon: 'grid layout', label: 'Apps'},
  {icon: 'chat', label: 'Messages'},
  {icon: 'alarm', label: 'Notifications'},
];

export class HeaderNav extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query: '',
    };
  }
  render() {
    return (
      // 1
      <Menu borderless className='top-menu' fixed='top'>
        {/* 2 */}
        <Menu.Item header className='logo'>
          <Link to='/' className='brand-link'>
            <Icon name='youtube play' className='brand-icon'/>
            <span>medan-Tube</span>
          </Link>
        </Menu.Item>
        {/* 3 */}
        <Menu.Menu className='nav-container'>
          <Menu.Item className='search-input'>
            <Form onSubmit={this.onSubmit}>
              {/* 4 */}
              <Form.Field>
                <Input placeholder='Search'
                       size='small'
                       action='Go'
                       value={this.state.query}
                       onChange={this.onInputChange}
                />
              </Form.Field>
            </Form>
          </Menu.Item>
          {/* 5 */}
          <Menu.Menu position='right'>
            <Menu.Item>
              <Link to='/studio/videos' className='header-action header-action--upload' aria-label='Upload video link'>
                <Icon className='header-icon' name='video camera'/>
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
            {/* 7*/}
            <Menu.Item name='auth'>
              <AuthMenu/>
            </Menu.Item>
          </Menu.Menu>
        </Menu.Menu>
      </Menu>
    );
  }
  onInputChange = (event) => {
    this.setState({
      query: event.target.value,
    });
  };

  onSubmit = () => {
    const escapedSearchQuery = encodeURI(this.state.query);
    this.props.history.push(`/results?search_query=${escapedSearchQuery}`);
  };
}

export default withRouter(HeaderNav);
