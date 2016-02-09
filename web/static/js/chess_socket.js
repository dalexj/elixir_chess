/* jshint esnext: true */
import {Socket} from 'phoenix';

function Game(socket, opponent, myUsername, parent) {
  this.opponent = opponent;
  this.myUsername = myUsername;
  this.gameOver = false;
  this.started = false;
  this.color = 'white';
  this.board = null;
  this.parent = parent;

  this.create(socket);
}

Game.prototype = {
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
      console.log('game_continue');
      _this.board = payload.current_board;
      _this.start(payload);
    });
    channel.on('game_start', function(payload) {
      console.log('game_start');
      _this.start(payload);
    });
    channel.on('game_over', function(payload) {
      console.log('game_over');
      _this.over = true;
      channel.leave();
      _this.update();
    });
    console.log('creating');
    channel.on('game_test', function(payload) {
      console.log('game_test', (new Date()).getTime(), JSON.stringify(payload));
    });
    channel.on('game_update', function(payload) {
      console.log('game_update');
      _this.board = payload.current_board;
      _this.update();
    });
    console.log('joining', this.getGameRoomName(),(new Date()).getTime());
    channel.join().receive('ok', function() {
      console.log('ok');
    });
    console.log('done joining', (new Date()).getTime());
    this.channel = channel;
  },
  getGameRoomName() {
    return 'chess:game:' + [this.myUsername, this.opponent].sort().join('-');
  },
};

function ChessSocket() {
  this.users = [];
  this.game = null;
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

ChessSocket.prototype = {
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
    _.intersection(_.keys(values), ['users', 'invites', 'myUsername']).forEach(function(validVarName) {
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
      chessSocket.set({ users: payload.users });
      chessSocket.disconnectFromOfflineUsers();
    });
    this.lobbyChannel.join().receive('ok', function(response) {
      chessSocket.set({myUsername: response.username});
      console.log(response);
      setTimeout(function() {
        if(response.user) {
          chessSocket.joinGameWith(response.user);
        }
      }, 0);
    });
  },
  joinGameWith(name) {
    const invites = _.reject(invites, function(invite) {
      return invite === name;
    });
    this.game = new Game(this.socket, name, this.myUsername, this);
    this.set({ invites: invites });
  },
  challengeUser(name) {
    this.lobbyChannel.push('chess_invite', {username: name});
    this.joinGameWith(name);
  },
  disconnectFromOfflineUsers() {
    const invites = _.intersection(this.invites, this.users);
    let game = this.game;
    if(!game) {
      return;
    }
    if(!game.started && !!_.includes(this.users, game.opponent)) {
      game.leave();
      game = null;
    }
    this.set({invites: invites, game: game});
  },
  acceptInvite(name) {
    this.joinGameWith(name);
  },
  endGame(channel) {
    channel.end();
  },
};

export default ChessSocket;
