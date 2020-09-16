module.exports = {
  development: {
    client: "postgresql",
    connection: {
      user: "postgres",
      password: "admin",
      database: "trollo-dev",
    },
    migrations: {
      directory: "./db/migrations",
      tableName: "knex_migrations",
    },
    seeds: {
      directory: "./db/seeds",
    },
    debug: true,
  },
}
