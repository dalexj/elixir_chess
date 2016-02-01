/* jshint esnext: true */

const ChannelList = React.createClass({
  propTypes: {
    channels: React.PropTypes.array.isRequired,
  },
  render() {
    const component = this;
    return(
      <ul>
        {this.props.channels.map(function(channel, index) {
          return component.renderChannel(channel, index);
        })}
      </ul>
    );
  },
  renderChannel(channel, index) {
    if(channel.archived) {
      return (
        <li>
          Game with {channel.opponent} - Archived
        </li>
      );
    } else if(channel.over && _.includes(this.props.invites, channel.opponent)) {
      return (
        <li>
          Game with {channel.opponent} - Game over
          <div className="btn btn-default" onClick={this.props.chessSocket.acceptInvite.bind(this.props.chessSocket, channel.opponent)}>
            Accept Rematch
          </div>
        </li>
      );
    } else if(channel.over) {
      return (
        <li>
          Game with {channel.opponent} - Game over
          <div className="btn btn-default" onClick={this.props.chessSocket.challengeUser.bind(this.props.chessSocket, channel.opponent)}>
            Rematch
          </div>
        </li>
      );
    } else if(channel.started) {
      return (
        <li>
          Game with {channel.opponent}
          <div className="btn btn-default" onClick={this.props.chessSocket.endGame.bind(this.props.chessSocket, channel.channel)}>
            End the game
          </div>
        </li>
      );
    }
    return <li>Game with {channel.opponent} - Pending invitation</li>;
  },
});

export default ChannelList;
