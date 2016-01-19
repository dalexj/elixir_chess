defmodule ElixirChess.Repo.Migrations.CreateUser do
  use Ecto.Migration

  def change do
    create table(:users) do
      add :email, :string
      add :crypted_password, :string
      add :username, :string

      timestamps
    end
    create unique_index(:users, [:email])
    create unique_index(:users, [:username])

  end
end
