import * as Knex from "knex"

export async function seed(knex: Knex): Promise<void> {
  await knex("board").del()
  await knex("board").insert([
    {
      id: "482169af-38ef-4b5b-973d-471f49d6c25e",
      name: "General",
      team_id: "75011cb8-6da4-49ce-ac1d-e8e38a245b5b",
    },
    {
      id: "d271d8b3-e115-4f27-9218-806d27583b3b",
      name: "Ideas",
      team_id: "75011cb8-6da4-49ce-ac1d-e8e38a245b5b",
    },
  ])

  await knex("list").del()
  await knex("list").insert([
    {
      id: "f960f10d-08f9-4686-8416-b9bb25da4825",
      name: "ToDo",
      board_id: "482169af-38ef-4b5b-973d-471f49d6c25e",
    },
    {
      id: "89f392b0-84c9-4e64-97d5-a499adf1ab30",
      name: "Done",
      board_id: "482169af-38ef-4b5b-973d-471f49d6c25e",
    },
  ])

  await knex("card").del()
  await knex("card").insert([
    {
      id: "8e6d8d53-4374-4ac0-88fb-68d2aed46c1d",
      name: "Fix bugs",
      list_id: "f960f10d-08f9-4686-8416-b9bb25da4825",
      index: 0
    },
    {
      id: "ee0a3e69-abee-499a-a1ac-5522fb116f7d",
      name: "Add features",
      list_id: "f960f10d-08f9-4686-8416-b9bb25da4825",
      index: 1
    },
    {
      id: "17b84431-e89a-4a36-8b4b-74b387aa2322",
      name: "Fix bugs #2",
      list_id: "f960f10d-08f9-4686-8416-b9bb25da4825",
      index: 2
    },
    {
      id: "99010092-dc02-4bf1-802b-dc23c2fb5f8c",
      name: "Fix bug #10",
      list_id: "89f392b0-84c9-4e64-97d5-a499adf1ab30",
      index: 0
    },
    {
      id: "36f8b046-1db5-4ca3-982e-0539f43a8d6d",
      name: "Add feature #2",
      list_id: "89f392b0-84c9-4e64-97d5-a499adf1ab30",
      index: 1
    },
  ])
}
