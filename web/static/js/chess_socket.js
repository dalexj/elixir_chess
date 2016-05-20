/* jshint esnext: true */
import {Socket, Presence} from 'phoenix';

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
      _this.board = payload.current_board;
      _this.start(payload);
    });
    channel.on('game_start', function(payload) {
      _this.start(payload);
    });
    channel.on('game_over', function(payload) {
      _this.over = true;
      channel.leave();
      _this.update();
    });
    channel.on('game_test', function(payload) {
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

    this.presence_state = {};
    this.lobbyChannel.on('presence_state', state => {
      Presence.syncState(this.presence_state, state)
      this.syncPresence();
    });
    // receive 'presence_diff' from server, containing join/leave events
    this.lobbyChannel.on('presence_diff', diff => {
      Presence.syncDiff(this.presence_state, diff)
      this.syncPresence();
    });

    this.lobbyChannel.join().receive('ok', function(response) {
      chessSocket.set({myUsername: response.username});
      setTimeout(function() {
        if(response.user) {
          chessSocket.joinGameWith(response.user);
        }
      }, 0);
    });
  },
  syncPresence() {
    var users = Presence.list(this.presence_state, name => name);
    this.set({users: users});
    this.disconnectFromOfflineUsers();
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
