/* jshint esnext: true */
import {Socket} from 'deps/phoenix/web/static/js/phoenix';

const ParentComponent = React.createClass({
  getInitialState() {
    return {
      myUsername: null,
      users: [],
      channel: null,
      socket: null,
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
      component.disconnectFromOfflineUsers();
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
        <h2>Games</h2>
        <ul>
          {this.state.gameChannelsConnected.map(function(channel) {
            return component.renderChannel(channel);
          })}
        </ul>
      </div>
    );
  },
  renderChannel(channel) {
    if(channel.archived) {
      return (
        <li>
          Game with {channel.opponent} - Archived
        </li>
      );
    } else if(channel.over && _.includes(this.state.invites, channel.opponent)) {
      return (
        <li>
          Game with {channel.opponent} - Game over
          <div className="btn btn-default" onClick={this.acceptInvite.bind(this, channel.opponent)}>
            Accept Rematch
          </div>
        </li>
      );
    } else if(channel.over) {
      return (
        <li>
          Game with {channel.opponent} - Game over
          <div className="btn btn-default" onClick={this.challengeUser.bind(this, channel.opponent)}>
            Rematch
          </div>
        </li>
      );
    } else if(channel.started) {
      return (
        <li>
          Game with {channel.opponent}
          <div className="btn btn-default" onClick={this.endgame.bind(this, channel.channel)}>
            End the game
          </div>
        </li>
      );
    }
    return <li>Game with {channel.opponent} - Pending invitation</li>;
  },
  renderUser(user) {
    if(user === this.state.myUsername) {
      return <li>{user}</li>;
    } else if(this.inGameWith(user)) {
      return <li>{user} (currently in game with)</li>;
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
    const component = this;
    let gameChannelsConnected = this.state.gameChannelsConnected;
    const channel = this.state.socket.channel(this.getGameRoomName(name));
    channel.join();
    gameChannelsConnected.forEach(function(chan) {
      if(chan.opponent === name) {
        chan.archived = true;
      }
    });
    gameChannelsConnected = gameChannelsConnected.concat({
      topic:    channel.topic,
      channel:  channel,
      opponent: name,

      over: false,
      started: false,
      archived: false,
    });
    channel.on('game_start', function(payload) {
      _.find(component.state.gameChannelsConnected, {channel: channel}).started = true;
      component.setState();
    });
    channel.on('game_over', function(payload) {
      _.find(component.state.gameChannelsConnected, {channel: channel}).over = true;
      channel.leave();
      component.setState();
    });
    const invites = this.state.invites.filter(function(invite) {
      return invite !== name;
    });
    this.setState({gameChannelsConnected: gameChannelsConnected, invites: invites});
  },
  challengeUser(name) {
    this.state.channel.push('chess_invite', {username: name});
    this.joinGameWith(name);
  },
  endgame(channel) {
    channel.push('endgame');
  },
  inGameWith(user) {
    return _.includes(this.state.gameChannelsConnected.map(function(channel) {
      return channel.opponent;
    }), user);
  },
  disconnectFromOfflineUsers() {
    const component = this;
    const invites = _.intersection(this.state.invites, this.state.users);
    const gameChannelsConnected = this.state.gameChannelsConnected.filter(function(channel) {
      if(!channel.started && !_.includes(component.state.users, channel.opponent)) {
        channel.channel.leave();
        return false;
      }
      return true;
    });
    this.setState({invites: invites, gameChannelsConnected: gameChannelsConnected});
  },
});


export default ParentComponent;
