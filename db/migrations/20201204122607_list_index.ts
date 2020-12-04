import * as Knex from "knex"

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("list", (table) => {
    table.integer("index")
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("list", (table) => {
    table.dropColumn("index")
  })
}
