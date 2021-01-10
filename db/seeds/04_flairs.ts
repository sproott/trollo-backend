import * as Knex from "knex"

export async function seed(knex: Knex): Promise<void> {
  await knex("cards_flairs").del()

  await knex("flair").del()
  await knex("flair").insert([
    {
      id: "fe5c3358-8692-4718-85ca-0ededae3bf05",
      name: "Easy",
      hue: 240,
      team_id: "75011cb8-6da4-49ce-ac1d-e8e38a245b5b",
    },
    {
      id: "95041617-8940-4d0f-a678-3ad582031128",
      name: "Medium",
      hue: 120,
      team_id: "75011cb8-6da4-49ce-ac1d-e8e38a245b5b",
    },
    {
      id: "61e88bcf-c012-498e-81d9-cf1ef13f351a",
      name: "Difficult",
      hue: 0,
      team_id: "75011cb8-6da4-49ce-ac1d-e8e38a245b5b",
    },
  ])

  await knex("cards_flairs").insert([
    {
      card_id: "8e6d8d53-4374-4ac0-88fb-68d2aed46c1d",
      flair_id: "fe5c3358-8692-4718-85ca-0ededae3bf05",
    },
    {
      card_id: "8e6d8d53-4374-4ac0-88fb-68d2aed46c1d",
      flair_id: "95041617-8940-4d0f-a678-3ad582031128",
    },
    {
      card_id: "8e6d8d53-4374-4ac0-88fb-68d2aed46c1d",
      flair_id: "61e88bcf-c012-498e-81d9-cf1ef13f351a",
    },
  ])
}
