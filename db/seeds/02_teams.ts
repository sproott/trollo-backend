import * as Knex from "knex"

export async function seed(knex: Knex): Promise<void> {
  await knex("team").del()
  await knex("team").insert([
    {
      id: "92b81a02-cc11-418f-9bf9-313c092b1df3",
      name: "Team of the Bruhs",
    },
    {
      id: "ac671fd3-ebbb-4db5-98d2-861113110802",
      name: "Team of the New Era",
    },
    {
      id: "75011cb8-6da4-49ce-ac1d-e8e38a245b5b",
      name: "owner team 1",
    },
    {
      id: "68cce4ac-1a40-44a3-9d9a-865a34e64b6c",
      name: "owner team 2",
    },
  ])

  await knex("participant").del()
  await knex("participant").insert([
    {
      user_id: "960bbd7d-c49f-4218-aeba-c237591d2fb8",
      team_id: "92b81a02-cc11-418f-9bf9-313c092b1df3",
    },
    {
      user_id: "960bbd7d-c49f-4218-aeba-c237591d2fb8",
      team_id: "ac671fd3-ebbb-4db5-98d2-861113110802",
    },
    {
      user_id: "46936727-6e6a-4ba9-a332-30f6230820d5",
      team_id: "92b81a02-cc11-418f-9bf9-313c092b1df3",
    },
    {
      user_id: "19dccdc1-2238-46b5-979b-e97a2176870e",
      team_id: "ac671fd3-ebbb-4db5-98d2-861113110802",
    },
    {
      user_id: "ee986842-a9a6-44ac-b4e7-42d2a93aae44",
      team_id: "92b81a02-cc11-418f-9bf9-313c092b1df3",
      owner: true,
    },
    {
      user_id: "ee986842-a9a6-44ac-b4e7-42d2a93aae44",
      team_id: "ac671fd3-ebbb-4db5-98d2-861113110802",
      owner: true,
    },
    {
      user_id: "960bbd7d-c49f-4218-aeba-c237591d2fb8",
      team_id: "75011cb8-6da4-49ce-ac1d-e8e38a245b5b",
      owner: true,
    },
    {
      user_id: "960bbd7d-c49f-4218-aeba-c237591d2fb8",
      team_id: "68cce4ac-1a40-44a3-9d9a-865a34e64b6c",
      owner: true,
    },
  ])
}
