/* jshint esnext: true */

const UserList = React.createClass({
  propTypes: {
    users: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    myUsername: React.PropTypes.string,
    invites: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    opponent: React.PropTypes.string,
  },
  render() {
    const component = this;
    return(
      <ul>
        {this.props.users.map(function(username) {
          return component.renderUser(username);
        })}
      </ul>
    );
  },
  isInvitedBy(username) {
    return _.includes(this.props.invites, username);
  },
  inGameWith(username) {
    return this.props.opponent === username;
  },
  renderUser(username) {
    if(username === this.props.myUsername) {
      return <li>{username}</li>;
    } else if(this.inGameWith(username) && !this.props.game.started) {
      return <li>{username} (pending invite)</li>;
    } else if(this.isInvitedBy(username)) {
      return (
        <li>
          {username}
          <div style={{marginLeft: '20px'}} className="btn btn-default" onClick={this.props.chessSocket.acceptInvite.bind(this.props.chessSocket, username)}>
            Accept Invite
          </div>
        </li>
      );
    } else if(this.inGameWith(username) && this.props.game.over) {
      return (
        <li>
          {username}
          <div style={{marginLeft: '20px'}} className="btn btn-default" onClick={this.props.chessSocket.challengeUser.bind(this.props.chessSocket, username)}>
            Rematch
          </div>
        </li>
      );
    } else if(this.inGameWith(username)) {
      return <li>{username} (currently in game with)</li>;
    } else if(this.props.game && !this.props.game.over) {
      return <li>{username}</li>;
    } else {
      return (
        <li>
          {username}
          <div style={{marginLeft: '20px'}} className="btn btn-default" onClick={this.props.chessSocket.challengeUser.bind(this.props.chessSocket, username)}>
            Challenge
          </div>
        </li>
      );
    }
  },
});

export default UserList;
