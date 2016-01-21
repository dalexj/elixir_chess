defmodule ElixirChess.Repo.Migrations.CreateChessGame do
  use Ecto.Migration

  def change do
    create table(:chess_games) do
      add :move_history, :string
      add :finished, :boolean, default: false
      add :white_player_id, references(:users, on_delete: :nothing)
      add :black_player_id, references(:users, on_delete: :nothing)

      timestamps
    end
    create index(:chess_games, [:white_player_id])
    create index(:chess_games, [:black_player_id])

  end
end
