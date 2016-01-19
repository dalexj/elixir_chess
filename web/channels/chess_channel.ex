defmodule ElixirChess.ChessChannel do
  use ElixirChess.Web, :channel
  alias ElixirChess.ChannelMonitor

  def join("chess:lobby", payload, socket) do
    if authorized?(payload) do
      current_user = socket.assigns.current_user
      send self, {:after_join, ChannelMonitor.user_joined("lobby", current_user)["lobby"]}
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  def terminate(_reason, socket) do
    user_id = socket.assigns.current_user.id
    users = ChannelMonitor.user_left("lobby", user_id)["lobby"]
    broadcast! socket, "lobby_update", %{users: get_usernames(users)}

    :ok
  end

  defp authorized?(_payload) do
    true
  end

  def handle_info({:after_join, users}, socket) do
    broadcast! socket, "lobby_update", %{ users: get_usernames(users) }
    {:noreply, socket}
  end

  defp get_usernames(users) do
    Enum.map users, &(&1.username)
  end
end
