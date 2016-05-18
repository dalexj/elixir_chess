defmodule ElixirChess.PageControllerTest do
  use ElixirChess.ConnCase

  test "GET /" do
    conn = get build_conn(), "/"
    assert html_response(conn, 200) =~ "Phoenix Chess"
  end
end
