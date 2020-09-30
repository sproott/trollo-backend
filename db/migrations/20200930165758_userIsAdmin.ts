import * as Knex from "knex"

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("user", (table) => {
    table.boolean("isAdmin").defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("user", (table) => {
    table.dropColumn("isAdmin")
  })
}
