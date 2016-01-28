/* jshint esnext: true */
import {Socket} from 'deps/phoenix/web/static/js/phoenix';

const startingBoardState = 'a8:bR,b8:bN,c8:bB,d8:bQ,e8:bK,f8:bB,g8:bN,h8:bR,a7:bP,b7:bP,c7:bP,d7:bP,e7:bP,f7:bP,g7:bP,h7:bP,a2:wP,b2:wP,c2:wP,d2:wP,e2:wP,f2:wP,g2:wP,h2:wP,a1:wR,b1:wN,c1:wB,d1:wQ,e1:wK,f1:wB,g1:wN,h1:wR';

let BoardHelper = {
  init(opts) {
    this.board = ChessBoard('chessboard', {
      pieceTheme: 'images/chesspieces/wikipedia/{piece}.png',
      position: this.parseBoardState(startingBoardState),
      draggable: true,
      onDrop(moveStart, moveEnd) {
        if(moveStart === moveEnd) {
          return 'snapback';
        }
        const move = [moveStart, moveEnd].join('-');
        if(opts.onMove) {
          opts.onMove(move);
        }
      },
    });
  },
  update(boardState, animate) {
    this.board.position(this.parseBoardState(boardState), animate);
  },
  parseBoardState(boardState) {
    return boardState.split(',').reduce(function(pieces, data) {
      var split = data.split(':');
      pieces[split[0]] = split[1];
      return pieces;
    }, {});
  },
  flip() {
    this.board.flip();
  },
};

window.BoardHelper = BoardHelper;

const ChessGame = React.createClass({
  render() {
    const styles = {
      display: this.props.shouldRender ? 'block' : 'none'
    };
    return (
      <div style={styles}>
        <h1>hello world</h1>
        <div id="chessboard" style={{ width: "500px"}}></div>
      </div>
    );
  },
});

const ParentComponent = React.createClass({
  getInitialState() {
    return {
      myUsername: null,
      users: [],
      channel: null,
      socket: null,
      invites: [],
      gameChannelsConnected: [],
      selectedChannel: null,
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
      response.users.forEach(function(username) {
        component.joinGameWith(username);
      });
    });
    BoardHelper.init({
      onMove(move) {
        const game = getSelectedChannel();
        if(game && !game.over) {
          game.channel.push('make_move', {move: move});
        }
      },
    });
    this.setState({channel: channel, socket: socket});
  },
  getSelectedChannel() {
    return this.state.selectedChannel !== null && this.state.gameChannelsConnected[this.state.selectedChannel];
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
      topic:    channel.topic,
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

export default ChessSocket;
