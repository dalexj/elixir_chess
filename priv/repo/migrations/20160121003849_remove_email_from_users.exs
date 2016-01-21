defmodule ElixirChess.Repo.Migrations.RemoveEmailFromUsers do
  use Ecto.Migration

  def change do
    drop index(:users, [:email])
    alter table(:users) do
      remove :email
    end
  end
end
