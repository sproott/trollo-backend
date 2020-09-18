import "reflect-metadata"
import { Model } from "objection"
import { knex } from "../db/knex"
import express from "express"
import session from "express-session"
import { v4 as uuid } from "uuid"
import passport from "passport"
import { ApolloServer } from "apollo-server-express"
import initPassport from "./init/initPassport"
import getApolloConfig from "./init/apolloConfig"
import { Util } from "./common/lib/util"

const KnexSessionStore = require("connect-session-knex")(session)

let server, apolloServer

async function init() {
  // init knex
  Model.knex(knex)

  const store = new KnexSessionStore({
    knex,
    tablename: "sessions",
  })

  // init Apollo
  const apolloConfig = await getApolloConfig(__dirname + "/**/*.resolver.ts")

  apolloServer = new ApolloServer(apolloConfig)

  // init Passport
  initPassport()

  // create Express app
  const app = express()

  // add session capability to app
  app.use(
    session({
      genid: (req) => uuid(),
      secret: "bruhmoment01",
      resave: false,
      saveUninitialized: false,
      store,
    })
  )

  // add Passport to app
  app.use(passport.initialize())
  app.use(passport.session())

  // connect Apollo with Express
  apolloServer.applyMiddleware({ app })

  // start GraphQL server
  return new Promise((resolve, rejects) => {
    server = app.listen({ port: 4000 }, () => {
      console.info(`GraphQL server ready at http://localhost:4000${apolloServer.graphqlPath}`)
      resolve()
    })
  })
}

async function startServer(maxTries = 3) {
  let running = false
  let tries = 0
  let boot

  while (tries < maxTries) {
    tries++
    try {
      boot = await init()
      running = true
      break
    } catch (err) {
      console.error(`Server failed to start, try ${tries}/${maxTries}, error: \n`, err)
    }
    if (tries < maxTries) {
      await Util.sleep(5000)
    }
  }

  if (running) {
    return boot
  } else {
    console.error("Server failed to start, quitting")
    process.kill(process.pid, "SIGTERM")
  }
}

const boot = startServer(3)

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("SIGTERM received, terminating")
  })
})

export { server, apolloServer, boot }
