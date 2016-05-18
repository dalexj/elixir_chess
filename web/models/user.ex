defmodule ElixirChess.User do
  use ElixirChess.Web, :model
  # @derive {Poison.Encoder, only: [:username]}

  schema "users" do
    field :crypted_password, :string
    field :username, :string

    field :password, :string, virtual: true
    field :password_confirmation, :string, virtual: true

    timestamps
  end

  @required_fields ~w(password password_confirmation username)
  @optional_fields ~w()

  @doc """
  Creates a changeset based on the `model` and `params`.

  If no params are provided, an invalid changeset is returned
  with no validation performed.
  """
  def changeset(model, params \\ %{}) do
    model
    |> cast(params, @required_fields, @optional_fields)
    |> update_change(:username, &String.downcase/1)
    |> unique_constraint(:username)
    |> validate_format(:username, ~r/\A[a-z0-9]+\z/, message: "must only contain letters and numbers")
    |> validate_length(:password, min: 5)
    |> validate_confirmation(:password)
  end
end
