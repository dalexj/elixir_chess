defmodule ElixirChess.Router do
  use ElixirChess.Web, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", ElixirChess do
    pipe_through :browser # Use the default browser stack

    get "/", PageController, :index

    resources "/registrations", RegistrationController, only: [:new, :create]

    get  "/login",  SessionController, :new
    post "/login",  SessionController, :create
    get  "/logout", SessionController, :delete

    get "/chess", ChessController, :index
  end

  # Other scopes may use custom stacks.
  # scope "/api", ElixirChess do
  #   pipe_through :api
  # end
end
