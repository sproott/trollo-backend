import * as Knex from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("user", function (table) {
    table.increments("id")
    table.string("username").unique()
    table.string("email").unique()
    table.string("password")
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("user")
}
