defmodule ElixirChess.ChessGameTest do
  use ElixirChess.ModelCase

  alias ElixirChess.ChessGame

  @valid_attrs %{finished: true, move_history: "some content"}
  @invalid_attrs %{}

  test "changeset with valid attributes" do
    changeset = ChessGame.changeset(%ChessGame{}, @valid_attrs)
    assert changeset.valid?
  end

  test "changeset with invalid attributes" do
    changeset = ChessGame.changeset(%ChessGame{}, @invalid_attrs)
    refute changeset.valid?
  end
end
