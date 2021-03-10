import * as Knex from "knex"

import { hash } from "../../src/common/lib/crypt"

export async function seed(knex: Knex): Promise<void> {
  await knex("participant").del()
  await knex("team").del()

  await knex("user").del()
  await knex("user").insert([
    {
      id: "ee986842-a9a6-44ac-b4e7-42d2a93aae44",
      username: "bob",
      email: "bob33@gmail.com",
      password: await hash("bruhbruhbob"),
    },
    {
      id: "19dccdc1-2238-46b5-979b-e97a2176870e",
      username: "john",
      email: "john03@gmail.com",
      password: await hash("bruhbruhjohn"),
    },
    {
      id: "46936727-6e6a-4ba9-a332-30f6230820d5",
      username: "alex",
      email: "alex12@gmail.com",
      password: await hash("bruhbruhalex"),
    },
    {
      id: "960bbd7d-c49f-4218-aeba-c237591d2fb8",
      username: "AppAdmin",
      email: "admin@trollo.com",
      is_admin: true,
      password: await hash("admin123"),
    },
  ])
}
