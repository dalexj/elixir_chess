/* jshint esnext: true */
import UserList from './user_list';
import ChannelList from './channel_list';
import BoardHelper from './board_helper';
import ChessSocket from './chess_socket';

const ChessGame = React.createClass({
  render() {
    const styles = {};
    if(!this.props.shouldRender) {
      styles.display = 'none';
    }
    return (
      <div style={styles}>
        <div id="chessboard" style={{ width: '500px' }}></div>
      </div>
    );
  },
});

const ParentComponent = React.createClass({
  getInitialState() {
    return {
      selectedChannel: null,
      chessSocket: null,
      myUsername: null,
      gameChannels: [],
      invites: [],
      users: [],
      boardHelper: null,
    };
  },

  getUserToken() {
    return $('meta[name=channel_token]').attr('content');
  },
  readStateFromSocket() {
    this.setState({
      users: this.chessSocket.users,
      invites: this.chessSocket.invites,
      myUsername: this.chessSocket.myUsername,
    });
  },
  onSocketUpdate() {
    this.readStateFromSocket();
  },
  componentDidMount() {
    const component = this;
    if(!this.getUserToken()) {
      console.log('not logged in');
      return;
    }
    const boardHelper = new BoardHelper({
      domID: 'chessboard',
      onMove(move) {
        const game = component.state.gameChannels[0];
        if(game && !game.over) {
          game.channel.push('make_move', {move: move});
        }
      },
    });
    const socket = new ChessSocket();
    socket.addListener(this.onSocketUpdate);
    this.setState({socket: socket, boardHelper: boardHelper});
  },
  getSelectedChannel() {
    return this.state.selectedChannel !== null && this.state.gameChannelsConnected[this.state.selectedChannel];
  },
  render() {
    const component = this;
    return(
      <div>
        <div className="col-md-4">
          <h2>Current Users</h2>
          <UserList users={this.state.users} myUsername={this.state.myUsername} invites={this.state.invites} />
          <h2>Games</h2>
          <ChannelList channels={this.state.gameChannels}/>
        </div>
        <div className="col-md-8">
          <ChessGame channel={this.state.currentChannel} shouldRender={!!this.state.selectedChannel} />
        </div>

      </div>
    );
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
  selectChannel(index){
    this.setState({selectedChannel: index});
    if(this.getSelectedChannel()) {
      BoardHelper.update(this.getSelectedChannel().board, false);
    }
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
    const chan = {
      channel:  channel,
      opponent: name,

      over: false,
      started: false,
      archived: false,
      color: 'white',
      board: startingBoardState,
    };
    gameChannelsConnected = gameChannelsConnected.concat(chan);
    channel.on('game_continue', function(payload) {
      chan.started = true;
      chan.color = payload[component.state.myUsername];
      if(chan.color === 'black') {
        BoardHelper.flip();
      }
      component.setState();
      chan.board = payload.current_board;
      BoardHelper.update(payload.current_board);
    });
    if(this.state.selectedChannel === null) {
      this.selectChannel(0);
    }
    channel.on('game_start', function(payload) {
      chan.started = true;
      chan.color = payload[component.state.myUsername];
      if(chan.color === 'black') {
        BoardHelper.flip();
      }
      component.setState();
    });
    channel.on('game_over', function(payload) {
      _.find(component.state.gameChannelsConnected, {channel: channel}).over = true;
      channel.leave();
      component.setState();
    });
    channel.on('game_update', function(payload) {
      BoardHelper.update(payload.current_board);
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
