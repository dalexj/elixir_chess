/* jshint esnext: true */
import {Socket} from 'deps/phoenix/web/static/js/phoenix';

ParentComponent = React.createClass({
  getInitialState() {
    return {
      myUsername: null,
      users: [],
      channel: null,
      invite: '',
    };
  },

  getUserToken() {
    return $('meta[name=channel_token]').attr('content');
  },

  componentDidMount() {
    const component = this;
    if(!this.getUserToken()) {
      console.log('not logged in');
      return;
    }
    const socket = new Socket('/socket', {params: {token: this.getUserToken()}});
    socket.connect();

    const channel = socket.channel('chess:lobby');
    channel.on('lobby_update', function(payload) {
      component.setState({ users: payload.users });
    });
    channel.on('chess_invite', function(payload) {
      component.setState({ invite: payload.message });
    });

    channel.join().receive('ok', function(response) {
      component.setState({myUsername: response.username});
    });
    this.setState({channel: channel});
  },
  render() {
    const component = this;
    return(
      <div>
        <h2>Current Users</h2>
        <ul>
          {this.state.users.map(function(user) {
            return component.renderUser(user);
          })}
        </ul>
        <h2>{this.state.invite}</h2>
      </div>
    );
  },
  renderUser(user) {
    if(user === this.state.myUsername) {
      return <li>{user}</li>;
    } else {
      return (
        <li>
          {user}
          <div style={{marginLeft: "20px"}} className="btn btn-default" onClick={this.challengeUser.bind(this, user)}>
            Challenge
          </div>
        </li>
      );
    }
  },
  challengeUser(name) {
    this.state.channel.push('chess_invite', {username: name});
  },
});


export default ParentComponent;
