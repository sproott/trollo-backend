import * as Knex from "knex"


export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("card", table => {
    table.integer("index")
  })
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("card", table => {
    table.dropColumn("index")
  })
}

