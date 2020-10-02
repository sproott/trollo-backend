const knexSettings = {
  development: {
    client: "postgresql",
    connection: {
      user: "postgres",
      password: "admin",
      database: "trollo_dev",
    },
    migrations: {
      directory: "./db/migrations",
      tableName: "knex_migrations",
    },
    seeds: {
      directory: "./db/seeds",
    },
    debug: false,
  },
}

export default knexSettings
