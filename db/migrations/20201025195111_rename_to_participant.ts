import * as Knex from "knex"

export async function up(knex: Knex): Promise<void> {
  return knex.schema.renameTable("users_teams", "participant")
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.renameTable("participant", "users_teams")
}
