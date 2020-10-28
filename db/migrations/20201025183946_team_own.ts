import * as Knex from "knex"

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable("team", (table) => {
      table.dropColumn("admin_id")
    })
    .alterTable("users_teams", (table) => {
      table.boolean("owner").defaultTo(false)
    })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable("team", (table) => {
      table.uuid("admin_id").references("id").inTable("user").onDelete("CASCADE")
    })
    .alterTable("users_teams", (table) => {
      table.dropColumn("owner")
    })
}
