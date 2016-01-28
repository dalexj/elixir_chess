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
          <div className="btn btn-default" onClick={this.selectChannel.bind(this, index)}>select</div>
          Game with {channel.opponent} - Archived
        </li>
      );
    } else if(channel.over && _.includes(this.state.invites, channel.opponent)) {
      return (
        <li>
          <div className="btn btn-default" onClick={this.selectChannel.bind(this, index)}>select</div>
          Game with {channel.opponent} - Game over
          <div className="btn btn-default" onClick={this.acceptInvite.bind(this, channel.opponent)}>
            Accept Rematch
          </div>
        </li>
      );
    } else if(channel.over) {
      return (
        <li>
          <div className="btn btn-default" onClick={this.selectChannel.bind(this, index)}>select</div>
          Game with {channel.opponent} - Game over
          <div className="btn btn-default" onClick={this.challengeUser.bind(this, channel.opponent)}>
            Rematch
          </div>
        </li>
      );
    } else if(channel.started) {
      return (
        <li>
          <div className="btn btn-default" onClick={this.selectChannel.bind(this, index)}>select</div>
          Game with {channel.opponent}
          <div className="btn btn-default" onClick={this.endgame.bind(this, channel.channel)}>
            End the game
          </div>
        </li>
      );
    }
    return <li>Game with {channel.opponent} - Pending invitation</li>;
  },
});

export default ChannelList;
