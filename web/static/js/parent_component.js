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
  readStateFromSocket() {
    this.setState({
      users: this.state.chessSocket.users,
      invites: this.state.chessSocket.invites,
      myUsername: this.state.chessSocket.myUsername,
      gameChannels: this.state.chessSocket.gameChannels,
    });
  },
  onSocketUpdate() {
    this.readStateFromSocket();
    if(this.state.gameChannels[0]) {
      this.state.boardHelper.update(this.state.gameChannels[0].board);
    }
  },
  componentDidMount() {
    const component = this;
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
    this.setState({chessSocket: socket, boardHelper: boardHelper});
  },
  getOpponents() {
    let channels = [];
    if(this.state.chessSocket) {
      channels = this.state.chessSocket.gameChannels || [];
    }
    return _.map(channels, 'opponent');
  },
  render() {
    const component = this;
    return(
      <div>
        <div className="col-md-4">
          <h2>Current Users</h2>
          <UserList
            users={this.state.users}
            myUsername={this.state.myUsername}
            invites={this.state.invites}
            opponents={this.getOpponents()}
            chessSocket={this.state.chessSocket}
          />
          <h2>Games</h2>
          <ChannelList channels={this.state.gameChannels} chessSocket={this.state.chessSocket}/>
        </div>
        <div className="col-md-8">
          <ChessGame channel={this.state.currentChannel} shouldRender={true} />
        </div>
      </div>
    );
  },
});

export default ParentComponent;
