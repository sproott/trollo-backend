const knexSettings = {
  development: {
    client: "pg",
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
  production: {
    client: "pg",
    connection: process.env.DATABASE_URL,
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
