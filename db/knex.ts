import knexSettings from "../knexfile"
import Knex from "knex"

const environment = process.env.NODE_ENV ?? "development"
// @ts-ignore
const config = knexSettings[environment]
const knex: Knex = require("knex")(config)

export { knex }
