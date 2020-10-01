import Knex, { CreateTableBuilder } from "knex"

export const uuid = (table: CreateTableBuilder, knex: Knex) => {
  table.uuid("id").unique().defaultTo(knex.raw("uuid_generate_v4()"))
}
