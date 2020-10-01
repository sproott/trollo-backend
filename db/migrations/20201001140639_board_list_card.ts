import * as Knex from "knex"
import { uuid } from "../lib"

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable("board", (table) => {
      uuid(table, knex)
      table.string("name")
      table.uuid("team_id").references("id").inTable("team").onDelete("CASCADE")
    })
    .createTable("list", (table) => {
      uuid(table, knex)
      table.string("name")
      table.uuid("board_id").references("id").inTable("board").onDelete("CASCADE")
    })
    .createTable("card", (table) => {
      uuid(table, knex)
      table.string("name")
      table.string("description")
      table.uuid("list_id").references("id").inTable("list").onDelete("CASCADE")
    })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("card").dropTable("list").dropTable("board")
}
