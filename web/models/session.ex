defmodule ElixirChess.Session do
  alias ElixirChess.User
  alias ElixirChess.Repo

  def login(params) do
    user = Repo.get_by(User, username: String.downcase(params["username"]))
    if authenticate(user, params["password"]) do
      {:ok, user}
    else
      :error
    end
  end

  defp authenticate(nil, _password), do: false
  defp authenticate(user, password) do
    Comeonin.Bcrypt.checkpw(password, user.crypted_password)
  end

  def current_user(conn) do
    if conn.assigns[:current_user] do
      conn.assigns[:current_user]
    else
      id = Plug.Conn.get_session(conn, :current_user)
      if id, do: Repo.get(User, id)
    end
  end
  def logged_in?(conn), do: !!current_user(conn)

end
