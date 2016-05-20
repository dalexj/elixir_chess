defmodule ElixirChess.Presence do
  use Phoenix.Presence, otp_app: :elixir_chess, pubsub_server: ElixirChess.PubSub
end
