defmodule ElixirChess.ChessGameChannel do
  use ElixirChess.Web, :channel
  import Ecto.Query, only: [from: 2]

  def join(room_name = "chess:game:" <> usernames, _payload, socket) do
    if authorized?(usernames, socket) do
      current_user = socket.assigns.current_user
      socket = assign(socket, :channel_name, room_name)
      send self, :after_join
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
    game = find_game_from_channel_name(socket.assigns.channel_name)
    Repo.update ChessGame.changeset(game, %{finished: true})
    {:noreply, socket}
  end

  intercept ["presence_diff"]
  def handle_out("presence_diff", _payload, socket), do: {:noreply, socket}

  def handle_info(:after_join, socket) do
    {:ok, _} = Presence.track(socket, socket.assigns.current_user, %{})
    users = socket |> Presence.list |> Map.keys
    game = find_game_from_channel_name(socket.assigns.channel_name)
    if game do
      {user1, user2} = {game.black_player, game.white_player}
      payload = %{ current_board: ChessGame.from_history(game.move_history) }
        |> Map.put(user1.username, "black")
        |> Map.put(user2.username, "white")
      push socket, "game_continue", payload
    else
      if length(users) == 2 do
        [user1, user2] = Enum.shuffle users # randomize white/black
        Repo.insert ChessGame.changeset(%ChessGame{}, %{black_player_id: user1.id, white_player_id: user2.id})
        payload = %{}
          |> Map.put(user1.username, "black")
          |> Map.put(user2.username, "white")
        broadcast! socket, "game_start", payload
      end
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
    user_ids = Repo.all from u in User,
      where:  u.username in ^String.split(channel_name, "-"),
      select: u.id
    (from g in ChessGame, where:
      g.black_player_id in ^user_ids and
      g.white_player_id in ^user_ids and
      g.finished == false,
      preload: [:white_player, :black_player])
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
