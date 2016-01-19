defmodule ElixirChess.SessionController do
  use ElixirChess.Web, :controller
  alias ElixirChess.Session

  def new(conn, _params) do
    render conn, "new.html"
  end

  def create(conn, %{"session" => session_params}) do
    case Session.login(session_params) do
      {:ok, user} ->
        conn
        |> put_session(:current_user, user.id)
        |> redirect(to: "/chess")
      :error ->
        conn
        |> put_flash(:info, "Incorrect username or password")
        |> render("new.html")
    end
  end

  def delete(conn, _) do
    conn
    |> delete_session(:current_user)
    |> put_flash(:info, "Logged out")
    |> redirect(to: "/")
  end
end
