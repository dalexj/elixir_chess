defmodule ElixirChess.UserSocket do
  use Phoenix.Socket
  alias ElixirChess.Repo
  alias ElixirChess.User

  ## Channels
  channel "chess:lobby", ElixirChess.ChessChannel
  channel "chess:game:*", ElixirChess.ChessGameChannel

  ## Transports
  transport :websocket, Phoenix.Transports.WebSocket
  def connect(%{"token" => token}, socket) do
    # max age of 1 day (86400 seconds)
    case Phoenix.Token.verify(socket, "user", token, max_age: 86400) do
      {:ok, user_id} ->
        socket = assign(socket, :current_user, Repo.get!(User, user_id))
        {:ok, socket}
      {:error, _} ->
        :error
    end
  end

  def id(_socket), do: nil
end
