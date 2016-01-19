// To use Phoenix channels, the first step is to import Socket
// and connect at the socket path in "lib/my_app/endpoint.ex":
import {Socket} from 'deps/phoenix/web/static/js/phoenix'

window.userToken = $('meta[name=channel_token]').attr('content')
let socket = new Socket('/socket', {params: {token: window.userToken}})

socket.connect()

// Now that you are connected, you can join channels with a topic:
// let channel = socket.channel("topic:subtopic", {})
// channel.join()
//   .receive("ok", resp => { console.log("Joined successfully", resp) })
//   .receive("error", resp => { console.log("Unable to join", resp) })

export default socket
