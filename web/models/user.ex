defmodule ElixirChess.User do
  use ElixirChess.Web, :model

  schema "users" do
    field :email, :string
    field :crypted_password, :string
    field :username, :string

    field :password, :string, virtual: true
    field :password_confirmation, :string, virtual: true

    timestamps
  end

  @required_fields ~w(email password password_confirmation username)
  @optional_fields ~w()

  @doc """
  Creates a changeset based on the `model` and `params`.

  If no params are provided, an invalid changeset is returned
  with no validation performed.
  """
  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @required_fields, @optional_fields)
    |> unique_constraint(:email)
    |> unique_constraint(:username)
    |> validate_format(:email, ~r/@/)
    |> validate_format(:username, ~r/\A[a-z0-9]+\z/i, message: "must only contain letters and numbers")
    |> validate_length(:password, min: 5)
    |> validate_confirmation(:password)
  end
end
