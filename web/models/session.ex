defmodule ElixirChess.Session do
  alias ElixirChess.User

  def login(params, repo) do
    user = repo.get_by(User, email: String.downcase(params["email"]))
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
    id = Plug.Conn.get_session(conn, :current_user)
    if id, do: Repo.get(User, id)
  end
  def logged_in?(conn), do: !!current_user(conn)

end
