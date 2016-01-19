/* jshint esnext: true */
// To use Phoenix channels, the first step is to import Socket
// and connect at the socket path in "lib/my_app/endpoint.ex":
import {Socket} from 'deps/phoenix/web/static/js/phoenix';

window.connectToChess = function () {
  window.userToken = $('meta[name=channel_token]').attr('content');
  if (!window.userToken) {
    console.log('not logged in');
    return;
  }
  let socket = new Socket('/socket', {params: {token: window.userToken}});

  socket.connect();
  let channel = socket.channel('chess:lobby');
  var currentUsersDiv = $('#current-users');
  channel.on('lobby_update', function(payload) {
    currentUsersDiv.empty();
    payload.users.forEach(function(username) {
      currentUsersDiv.append('<li>'+username+'</li>');
    });
  });
  channel.join()
    .receive("ok", resp => { console.log("Joined successfully", resp); })
    .receive("error", resp => { console.log("Unable to join", resp); });
};
// export default socket
