defmodule ElixirChess.ChessGame do
  use ElixirChess.Web, :model

  schema "chess_games" do
    field :move_history, :string
    field :finished, :boolean, default: false
    belongs_to :white_player, ElixirChess.User
    belongs_to :black_player, ElixirChess.User

    timestamps
  end

  @required_fields ~w(black_player_id white_player_id)
  @optional_fields ~w(finished move_history)

  @doc """
  Creates a changeset based on the `model` and `params`.

  If no params are provided, an invalid changeset is returned
  with no validation performed.
  """
  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @required_fields, @optional_fields)
    |> validate_change(:move_history, &validate_move_history/2)
  end

  defp validate_move_history(:move_history, value) do
    case from_history(value) do
      {:error, _ } -> [move_history: "is invalid"]
      _ -> []
    end
  end

  # pieces are in format "#{color}#{type}"
  # color is one of the following:
  # black: "b"
  # white: "w"
  # type is one of the following:
  # rook: "r"
  # knight: "n"
  # bishop: "b"
  # queen: "q"
  # king: "k"
  # pawn: "p"
  defp default_board do
    [ "a8:bR,b8:bN,c8:bB,d8:bQ,e8:bK,f8:bB,g8:bN,h8:bR",
      "a7:bP,b7:bP,c7:bP,d7:bP,e7:bP,f7:bP,g7:bP,h7:bP",
      "a2:wP,b2:wP,c2:wP,d2:wP,e2:wP,f2:wP,g2:wP,h2:wP",
      "a1:wR,b1:wN,c1:wB,d1:wQ,e1:wK,f1:wB,g1:wN,h1:wR"]
    |> Enum.join(",")
  end

  def from_history(history) do
    default_board
    |> String.split(",")
    |> make_moves(String.split history, ",")
  end

  # ElixirChess.ChessGame.from_history "e2-e4"

  defp make_moves(board, []), do: Enum.join board, ","
  defp make_moves(board, ["" | t]), do: make_moves(board, t)
  defp make_moves(board, [h | t]) do
    [from_loc, to_loc] = String.split h, "-"
    {from_index, from_piece} = find_piece_info(from_loc, board)
    {to_index, to_piece} = find_piece_info(to_loc, board)

    if !from_index do
      {:error, :no_piece}
    else
      if to_index do
        if String.at(from_piece, 0) == String.at(to_piece, 0) do
          {:error, :cant_take_same_color}
        else
          board
          |> List.replace_at(from_index, "#{to_loc}:#{from_piece}")
          |> List.delete_at(to_index)
          |> make_moves(t)
        end
      else
        board
        |> List.replace_at(from_index, "#{to_loc}:#{from_piece}")
        |> make_moves(t)
      end
    end
  end

  defp find_piece_info(loc, board) do
    val = board
      |> Enum.with_index
      |> Enum.find(fn({info, _i}) ->
        String.starts_with? info, loc
      end)
    if val do
      {square, index} = val
      [_loc, piece] = String.split square, ":"
      {index, piece}
    else
      {nil, nil}
    end
  end
end
