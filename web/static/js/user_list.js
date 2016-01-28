/* jshint esnext: true */

const UserList = React.createClass({
  propTypes: {
    users: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    myUsername: React.PropTypes.string,
    invites: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
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
  renderUser(username) {
    if(username === this.props.myUsername) {
      return <li>{username}</li>;
    } else if(this.inGameWith(username)) {
      return <li>{username} (currently in game with)</li>;
    } else if(this.isInvitedBy(username)) {
      return (
        <li>
          {username}
          <div style={{marginLeft: '20px'}} className="btn btn-default" onClick={this.acceptInvite.bind(this, username)}>
            Accept Invite
          </div>
        </li>
      );
    } else {
      return (
        <li>
          {username}
          <div style={{marginLeft: '20px'}} className="btn btn-default" onClick={this.challengeUser.bind(this, username)}>
            Challenge
          </div>
        </li>
      );
    }
  },
});

export default UserList;
