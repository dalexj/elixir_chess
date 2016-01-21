defmodule ElixirChess.ChessGameChannel do
  use ElixirChess.Web, :channel
  alias ElixirChess.ChannelMonitor

  def join(room_name = "chess:game:" <> usernames, _payload, socket) do
    if authorized?(usernames, socket) do
      current_user = socket.assigns.current_user
      send self, {:after_join, ChannelMonitor.user_joined(room_name, current_user)[room_name]}
      socket = assign(socket, :games_joined, [room_name | socket.assigns[:games_joined] || []])
      IO.puts "#{current_user.username} has joined #{room_name}"
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  def handle_in("ping", payload, socket) do
    {:reply, {:ok, payload}, socket}
  end

  def handle_out(event, payload, socket) do
    push socket, event, payload
    {:noreply, socket}
  end

  def terminate(_reason, socket) do
    user_id = socket.assigns.current_user.id
    Enum.each socket.assigns.games_joined, fn(channel) ->
      ChannelMonitor.user_left(channel, user_id)[channel]
    end
    :ok
  end

  def handle_info({:after_join, users}, socket) do
    if length(users) == 2 do
      broadcast! socket, "game_start", %{message: "testing"}
    end
    {:noreply, socket}
  end

  defp authorized?(channel_name, socket) do
    usernames = String.split(channel_name, "-")
    Regex.match?(~r/\A[a-z0-9]+-[a-z0-9]+\z/, channel_name) &&
      socket.assigns.current_user.username in usernames &&
      usernames == Enum.sort(usernames)
  end
end
