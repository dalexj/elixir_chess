defmodule ElixirChess.ChessGameChannel do
  use ElixirChess.Web, :channel
  alias ElixirChess.ChannelMonitor
  alias ElixirChess.ChessGame
  alias ElixirChess.Repo

  def join(room_name = "chess:game:" <> usernames, _payload, socket) do
    if authorized?(usernames, socket) do
      current_user = socket.assigns.current_user
      send self, {:after_join, ChannelMonitor.user_joined(room_name, current_user)[room_name]}
      socket = assign(socket, :channel_name, room_name)
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  def handle_in("endgame", _payload, socket) do
    broadcast! socket, "game_over", %{message: "testing"}
    {:noreply, socket}
  end

  def handle_out(event, payload, socket) do
    push socket, event, payload
    {:noreply, socket}
  end

  def terminate(_reason, socket) do
    user_id = socket.assigns.current_user.id
    channel_name = socket.assigns.channel_name
    ChannelMonitor.user_left(channel_name, user_id)
    :ok
  end

  def handle_info({:after_join, users}, socket) do
    if length(users) == 2 do
      [user1, user2] = Enum.shuffle users # randomize white/black
      Repo.insert ChessGame.changeset(%ChessGame{}, %{black_player_id: user1.id, white_player_id: user2.id})
      broadcast! socket, "game_start", %{user1.username => "black", user2.username => "white"}
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
