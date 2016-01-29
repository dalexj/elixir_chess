/* jshint esnext: true */
import {Socket} from 'phoenix';

function Game(socket, opponent, myUsername, parent) {
  this.opponent = opponent;
  this.myUsername = myUsername;
  this.gameOver = false;
  this.started = false;
  this.archived = false;
  this.hidden = false;
  this.color = 'white';
  this.board = null;
  this.parent = parent;

  this.create(socket);
}

Game.prototpye = {
  leave() {
    this.channel.leave();
  },
  end() {
    this.channel.push('endgame');
  },
  update() {
    this.parent.set();
  },
  start(payload) {
    this.started = true;
    this.color = payload[this.myUsername];
    this.update();
  },
  create(socket) {
    const _this = this;
    const channel = socket.channel(this.getGameRoomName());
    channel.on('game_continue', function(payload) {
      _this.board = payload.current_board;
      _this.start();
    });
    channel.on('game_start', function(payload) {
      _this.start();
    });
    channel.on('game_over', function(payload) {
      _this.over = true;
      channel.leave();
      _this.update();
    });
    channel.on('game_update', function(payload) {
      _this.board = payload.current_board;
      _this.update();
    });
    channel.join();
    this.channel = channel;
  },
  getGameRoomName() {
    return 'chess:game:' + [this.myUsername, this.opponent].sort().join('-');
  },
};

function ChessSocket() {
  this.users = [];
  this.gameChannels = [];
  this.invites = [];
  this.myUsername = null;
  this._listeners = [];

  if(!this.getUserToken()) {
    console.warn('not logged in - this should never happen');
    return;
  }

  this.socket = new Socket('/socket', {params: {token: this.getUserToken()}});
  this.socket.connect();
  this.joinLobby();
}

ChessSocket.prototpye = {
  addListener(func) {
    this._listeners.push(func);
  },
  triggerChange() {
    this._listeners.forEach(function(listener) {
      listener();
    });
  },
  getUserToken() {
    return $('meta[name=channel_token]').attr('content');
  },
  set(values) {
    // similar to react setState
    const chessSocket = this;
    ['users', 'invites', 'myUsername'].forEach(function(validVarName) {
      chessSocket[validVarName] = values[validVarName];
    });
    this.triggerChange();
  },

  joinLobby() {
    const chessSocket = this;
    this.lobbyChannel = this.socket.channel('chess:lobby');
    this.lobbyChannel.on('chess_invite', function(payload) {
      chessSocket.set({ invites: chessSocket.invites.concat(payload.username) });
    });
    this.lobbyChannel.on('lobby_update', function(payload) {
      chessSocket.set({ users: users });
      chessSocket.disconnectFromOfflineUsers();
    });
    this.lobbyChannel.join().receive('ok', function(response) {
      chessSocket.set({myUsername: response.username});
      response.users.forEach(function(username) {
        chessSocket.joinGameWith(username);
      });
    });
  },
  getSelectedChannel() {
    return this.state.selectedChannel !== null && this.state.gameChannelsConnected[this.state.selectedChannel];
  },
  joinGameWith(name) {
    this.gameChannels.forEach(function(conn) {
      if(conn.opponent === name) {
        conn.archived = true;
      }
    });
    const invites = _.reject(invites, function(invite) {
      return invite === name;
    });
    this.gameChannels.push(new Game(this.socket, name, this.myUsername, this));
    this.set({ invites: invites });
  },
  challengeUser(name) {
    this.lobbyChannel.push('chess_invite', {username: name});
    this.joinGameWith(name);
  },
  inGameWith(user) {
    return _.includes(_.map(this.gameChannels, 'opponent'), user);
  },
  disconnectFromOfflineUsers() {
    const chessSocket = this;
    const invites = _.intersection(this.state.invites, this.state.users);
    const gameChannels = this.state.gameChannels.forEach(function(channel) {
      if(!channel.started && !_.includes(chessSocket.users, channel.opponent)) {
        channel.leave();
        channel.hidden = true;
      }
    });
    this.set({invites: invites, gameChannels: gameChannels});
  },
};

export default ChessSocket;
