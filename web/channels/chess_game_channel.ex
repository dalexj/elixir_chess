defmodule ElixirChess.ChessGameChannel do
  use ElixirChess.Web, :channel
  alias ElixirChess.{ChannelMonitor, ChessGame, Repo, User}
  import Ecto.Query, only: [from: 2]

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

  def handle_in("make_move", payload, socket) do
    game = find_game_from_channel_name(socket.assigns.channel_name)
    moves = add_move(game.move_history, payload["move"])
    result = game
      |> ChessGame.changeset(%{move_history: moves})
      |> Repo.update
    case result do
      {:ok, updated_game} ->
        current_board = ChessGame.from_history updated_game.move_history
        broadcast! socket, "game_update", %{current_board: current_board}
      {:error, _} -> nil
    end
    {:noreply, socket}
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
    Repo.delete_all ChessGame
    :ok
  end

  def handle_info({:after_join, users}, socket) do
    if length(users) == 2 do
      [user1, user2] = Enum.shuffle users # randomize white/black
      Repo.insert ChessGame.changeset(%ChessGame{}, %{black_player_id: user1.id, white_player_id: user2.id})
      payload = %{}
        |> Map.put(user1.username, "black")
        |> Map.put(user2.username, "white")
      broadcast! socket, "game_start", payload
    end
    {:noreply, socket}
  end

  defp authorized?(channel_name, socket) do
    usernames = String.split(channel_name, "-")
    Regex.match?(~r/\A[a-z0-9]+-[a-z0-9]+\z/, channel_name) &&
      socket.assigns.current_user.username in usernames &&
      usernames == Enum.sort(usernames)
  end

  defp find_game_from_channel_name("chess:game:" <> channel_name) do
    IO.inspect(channel_name)
    user_ids = Repo.all from u in User,
      where:  u.username in ^String.split(channel_name, "-"),
      select: u.id
    IO.inspect(user_ids)
    (from g in ChessGame, where:
      g.black_player_id in ^user_ids and
      g.white_player_id in ^user_ids and
      g.finished == false)
    |> Repo.all
    |> List.first
  end

  defp add_move(history, new_move) do
    if !history || history == "" do
      new_move
    else
      history <> "," <> new_move
    end
  end
end
