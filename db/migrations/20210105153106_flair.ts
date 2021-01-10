import * as Knex from "knex"

import { uuid } from "../lib"

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable("flair", (table) => {
      uuid(table, knex)
      table.string("name")
      table.integer("hue")
      table.uuid("team_id").references("id").inTable("team").onDelete("CASCADE")
    })
    .createTable("cards_flairs", (table) => {
      table.uuid("card_id").references("id").inTable("card").onDelete("CASCADE")
      table.uuid("flair_id").references("id").inTable("flair").onDelete("CASCADE")
    })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("cards_flairs").dropTable("flair")
}
