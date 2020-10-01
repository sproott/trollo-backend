import knexSettings from "../knexfile"

const environment = process.env.NODE_ENV ?? "development"
// @ts-ignore
const config = knexSettings[environment]
const knex = require("knex")(config)

export { knex }
