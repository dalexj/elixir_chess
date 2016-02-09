defmodule ElixirChess.ChessChannel do
  use ElixirChess.Web, :channel
  alias ElixirChess.{ChannelMonitor, ChessGame, Repo, User}

  def join("chess:lobby", _payload, socket) do
    user_im_in_game_with = get_user_in_game_with(socket.assigns.current_user.username)

    current_user = socket.assigns.current_user
    send self, {:after_join, ChannelMonitor.user_joined("lobby", current_user)["lobby"]}
    {:ok, %{username: current_user.username, user: user_im_in_game_with}, socket}
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

  defp get_user_in_game_with(current_username) do
    query = from g in ChessGame,
      join:  u in User,
      on:    u.id == g.black_player_id or u.id == g.white_player_id,
      where: u.username == ^current_username and g.finished == false,
      distinct: true,
      preload: [:white_player, :black_player]

    query
    |> Repo.all
    |> Enum.map(&([ &1.white_player.username, &1.black_player.username ]))
    |> List.flatten
    |> Enum.uniq
    |> Enum.reject(&(&1 == current_username))
    |> List.first
  end
end
