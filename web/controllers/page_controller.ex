defmodule ElixirChess.PageController do
  use ElixirChess.Web, :controller

  def index(conn, _params) do
    render conn, "index.html"
  end
end
