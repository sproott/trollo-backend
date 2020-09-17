const environment = process.env.NODE_ENV ?? "development"
const config = require("../knexfile.ts")[environment]
const knex = require("knex")(config)

export { knex }
