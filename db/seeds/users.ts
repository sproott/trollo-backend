import * as Knex from "knex"
import { hash } from "../../src/common/lib/crypt"

export async function seed(knex: Knex): Promise<void> {
  return knex("user")
    .del()
    .insert([
      {
        username: "bob",
        email: "bob33@gmail.com",
        password: await hash("bruhbruhbob"),
      },
      {
        username: "john",
        email: "john03@gmail.com",
        password: await hash("bruhbruhjohn"),
      },
      {
        username: "alex",
        email: "alex12@gmail.com",
        password: await hash("bruhbruhalex"),
      },
    ])
}
