/* jshint esnext: true */
import UserList from './user_list';
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
        <div style={{display: 'inline'}}>
          <div id="chessboard" style={{ width: '500px' }}></div>
        </div>
        {this.renderOverlay()}
      </div>
    );
  },
  renderOverlay() {
    if(this.props.clickable) {
      return null;
    }
    const styles = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '500px',
      height: '500px',
      marginLeft: '15px',
      backgroundColor: 'rgba(0,0,0,0.5)',
    };
    return <div style={styles}></div>;
  },
});

const ParentComponent = React.createClass({
  getInitialState() {
    return {
      chessSocket: null,
      myUsername: null,
      game: null,
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
      game: this.state.chessSocket.game,
    });
  },
  onSocketUpdate() {
    this.readStateFromSocket();
    if(this.state.game) {
      this.state.boardHelper.update(this.state.game.board);
    }
  },
  componentDidMount() {
    const component = this;
    const boardHelper = new BoardHelper({
      domID: 'chessboard',
      onMove(move) {
        const game = component.state.game;
        if(game && !game.over) {
          game.channel.push('make_move', {move: move});
        }
      },
    });
    const socket = new ChessSocket();
    socket.addListener(this.onSocketUpdate);
    this.setState({chessSocket: socket, boardHelper: boardHelper});
  },
  renderEndGameButton() {
    if(!this.state.game || !this.state.game.started) {
      return null;
    } else if(this.state.game.over) {
      return <h3>Game over</h3>;
    }
    return (
      <div className="btn btn-default" onClick={this.state.game.end.bind(this.state.game)}>
        End game with {this.state.game.opponent}
      </div>
    );
  },
  render() {
    return(
      <div>
        <div className="col-md-4">
          <h2>Current Users</h2>
          <UserList
            users={this.state.users}
            myUsername={this.state.myUsername}
            invites={this.state.invites}
            opponent={this.state.game && this.state.game.opponent}
            chessSocket={this.state.chessSocket}
            game={this.state.game}
          />
          {this.renderEndGameButton()}
        </div>
        <div className="col-md-8">
          <ChessGame shouldRender={this.state.game} clickable={this.state.game && this.state.game.started} />
        </div>
      </div>
    );
  },
});

export default ParentComponent;
