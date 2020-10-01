import * as Knex from "knex"
import { uuid } from "../lib"

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable("user", (table) => {
      table.unique(["id"])
    })
    .createTable("team", (table) => {
      uuid(table, knex)
      table.string("name")
    })
    .createTable("users_teams", (table) => {
      table.uuid("user_id").references("user.id")
      table.uuid("team_id").references("team.id")
    })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("team").dropTable("users_teams")
}
