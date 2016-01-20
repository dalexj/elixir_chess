/* jshint esnext: true */
import {Socket} from 'deps/phoenix/web/static/js/phoenix';

const ParentComponent = React.createClass({
  getInitialState() {
    return {
      myUsername: null,
      users: [],
      channel: null,
      invites: [],
      gameChannelsConnected: [],
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
      component.setState({ invites: component.state.invites.concat(payload.username) });
    });

    channel.join().receive('ok', function(response) {
      component.setState({myUsername: response.username});
    });
    this.setState({channel: channel, socket: socket});
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
      </div>
    );
  },
  renderUser(user) {
    if(user === this.state.myUsername) {
      return <li>{user}</li>;
    } else if(this.state.invites.indexOf(user) > -1) {
      return (
        <li>
          {user}
          <div style={{marginLeft: "20px"}} className="btn btn-default" onClick={this.acceptInvite.bind(this, user)}>
            Accept Invite
          </div>
        </li>
      );
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
  acceptInvite(name) {
    this.joinGameWith(name);
  },
  getGameRoomName(name) {
    return 'chess:game:' + [this.state.myUsername, name].sort().join('-');
  },
  joinGameWith(name) {
    let gameChannelsConnected = this.state.gameChannelsConnected;
    const channel = this.state.socket.channel(this.getGameRoomName(name));
    channel.join();
    gameChannelsConnected = gameChannelsConnected.concat(channel);
    this.setState({gameChannelsConnected: gameChannelsConnected});
  },
  challengeUser(name) {
    this.state.channel.push('chess_invite', {username: name});
    this.joinGameWith(name);
  },
});


export default ParentComponent;
