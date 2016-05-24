defmodule ElixirChess.ChessChannelTest do
  use ElixirChess.ChannelCase

  alias ElixirChess.ChessChannel

  setup do
    {:ok, user}  = create_user("alex")
    {:ok, user2} = create_user("alex2")
    {:ok, _game} = create_chess_game(user, user2)
    {:ok, join_response, socket} =
      socket("random_string_that_doesnt_matter?", %{current_user: user})
        |> subscribe_and_join(ChessChannel, "chess:lobby")
    {:ok, join_response2, socket2} =
      socket("random_string_that_doesnt_matter?2", %{current_user: user2})
        |> subscribe_and_join(ChessChannel, "chess:lobby")
    on_exit fn ->
      leave socket
      leave socket2
    end
    {:ok, socket: socket, socket2: socket2, join_response: join_response, join_response2: join_response2}
  end

  test "can invite another player", %{socket: socket} do
    push socket, "chess_invite", %{"username" => "alex2"}
    assert_push "chess_invite", %{username: "alex"}
  end

  test "sends the game youre currently in", %{join_response: join_response, join_response2: join_response2} do
    assert join_response.user  == "alex2"
    assert join_response2.user == "alex"
  end
end
