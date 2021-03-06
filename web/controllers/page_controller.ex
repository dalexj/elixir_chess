defmodule ElixirChess.PageController do
  use ElixirChess.Web, :controller

  def index(conn, _params) do
    if logged_in?(conn) do
      redirect conn, to: "/chess"
    else
      render conn, "index.html"
    end
  end
end
