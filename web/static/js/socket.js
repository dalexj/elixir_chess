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
        {JSON.stringify(this.state.invites)}
        <ul>
          {this.state.users.map(function(user) {
            return component.renderUser(user);
          })}
        </ul>
        <h2>{"Channels I'm in"}</h2>
        <ul>
          {this.state.gameChannelsConnected.map(function(channel) {
            return component.renderChannel(channel);
          })}
        </ul>
      </div>
    );
  },
  renderChannel(channel) {
    if(channel.over && _.includes(this.state.invites, channel.opponent)) {
      return (
        <li>
          {channel.topic} - Game over
          <div className="btn btn-default" onClick={this.acceptInvite.bind(this, channel.opponent)}>
            Accept Rematch
          </div>
        </li>
      );
    } else if(channel.over) {
      return (
        <li>
          {channel.topic} - Game over
          <div className="btn btn-default" onClick={this.challengeUser.bind(this, channel.opponent)}>
            Rematch
          </div>
        </li>
      );
    } else if(channel.started) {
      return (
        <li>
          {channel.topic}
          <div className="btn btn-default" onClick={this.endgame.bind(this, channel.channel)}>
            End the game
          </div>
        </li>
      );
    }
    return <li>{channel.topic}</li>;
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
    gameChannelsConnected = gameChannelsConnected.concat({channel: channel, topic: channel.topic, started: false, over: false, opponent: name});
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
});


export default ParentComponent;
