defmodule ElixirChess.ChannelCase do
  @moduledoc """
  This module defines the test case to be used by
  channel tests.

  Such tests rely on `Phoenix.ChannelTest` and also
  imports other functionality to make it easier
  to build and query models.

  Finally, if the test case interacts with the database,
  it cannot be async. For this reason, every test runs
  inside a transaction which is reset at the beginning
  of the test unless the test case is marked as async.
  """

  use ExUnit.CaseTemplate

  using do
    quote do
      # Import conveniences for testing with channels
      use Phoenix.ChannelTest

      alias ElixirChess.{Repo, User, ChessGame}
      import Ecto.Model
      import Ecto.Query, only: [from: 2]

      def create_user(username) do
        %User{}
        |> User.changeset(%{username: username, password: "passw0rd", password_confirmation: "passw0rd"})
        |> Repo.insert
      end

      def create_chess_game(user1, user2) do
        %ChessGame{}
        |> ChessGame.changeset(%{black_player_id: user1.id, white_player_id: user2.id})
        |> Repo.insert
      end

      # The default endpoint for testing
      @endpoint ElixirChess.Endpoint
    end
  end

  setup tags do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(ElixirChess.Repo)

    unless tags[:async] do
      Ecto.Adapters.SQL.Sandbox.mode(ElixirChess.Repo, {:shared, self()})
    end

    :ok
  end
end
