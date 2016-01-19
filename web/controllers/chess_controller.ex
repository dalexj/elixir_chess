defmodule ElixirChess.ChessController do
  use ElixirChess.Web, :controller

  def index(conn, _params) do
    if logged_in?(conn) do
      render conn, "index.html"
    else
      redirect conn, to: "/"
    end
  end
end
