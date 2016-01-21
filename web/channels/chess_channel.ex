defmodule ElixirChess.ChessChannel do
  use ElixirChess.Web, :channel
  alias ElixirChess.ChannelMonitor

  def join("chess:lobby", _payload, socket) do
    current_user = socket.assigns.current_user
    send self, {:after_join, ChannelMonitor.user_joined("lobby", current_user)["lobby"]}
    {:ok, %{username: current_user.username}, socket}
  end

  def terminate(_reason, socket) do
    user_id = socket.assigns.current_user.id
    users = ChannelMonitor.user_left("lobby", user_id)["lobby"]
    broadcast! socket, "lobby_update", %{users: get_usernames(users)}
    :ok
  end

  def handle_in("chess_invite", %{"username" => username}, socket) do
    broadcast socket, "chess_invite", %{"username" => username, "sender" => socket.assigns.current_user.username }
    {:noreply, socket}
  end

  intercept ["chess_invite"]
  def handle_out("chess_invite", %{"username" => username, "sender" => sender}, socket) do
    if socket.assigns.current_user.username == username do
      push socket, "chess_invite", %{ username: sender}
    end
    {:noreply, socket}
  end

  def handle_info({:after_join, users}, socket) do
    broadcast! socket, "lobby_update", %{ users: get_usernames(users) }
    {:noreply, socket}
  end

  defp get_usernames(nil), do: []
  defp get_usernames(users) do
    Enum.map users, &(&1.username)
  end
end
