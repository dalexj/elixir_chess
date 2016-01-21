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
    [ "a8:br,b8:bn,c8:bb,d8:bq,e8:bk,f8:bb,g8:bn,h8:br",
      "a7:bp,b7:bp,c7:bp,d7:bp,e7:bp,f7:bp,g7:bp,h7:bp",
      "a2:wp,b2:wp,c2:wp,d2:wp,e2:wp,f2:wp,g2:wp,h2:wp",
      "a1:wr,b1:wn,c1:wb,d1:wq,e1:wk,f1:wb,g1:wn,h1:wr"]
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
