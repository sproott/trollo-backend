import * as Knex from "knex"

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("card", (table) => {
    table.uuid("assignee_id").references("id").inTable("user").nullable().onDelete("CASCADE")
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("card", (table) => {
    table.dropColumn("assignee_id")
  })
}
