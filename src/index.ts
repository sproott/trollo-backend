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
import { sleep } from "./common/lib/util"
import { Container } from "typescript-ioc"
import ON_DEATH from "death"

const KnexSessionStore = require("connect-session-knex")(session)

let server: any, apolloServer: any

async function init() {
  // init knex
  Model.knex(knex)

  const store = new KnexSessionStore({
    knex,
    tablename: "sessions",
  })

  // init Apollo
  const apolloConfig = await getApolloConfig(__dirname + "/**/*.resolver.*")

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
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7 * 365, // 7 years
      },
    })
  )

  // add Passport to app
  app.use(passport.initialize())
  app.use(passport.session())

  // connect Apollo with Express
  apolloServer.applyMiddleware({
    app,
    cors: {
      credentials: true,
      origin: "http://localhost:3000",
    },
  })

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
      await sleep(5000)
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

const gracefullyShutDown = async () => {
  console.info(
    `\nReceived exit signal, gracefully shutting down. \nStarted at: ${new Date().toISOString()}`
  )

  return apolloServer
    .stop()
    .then(() => {
      console.info(`Shutdown successful! \nFinished at: ${new Date().toISOString()}`)
    })
    .catch((error: any) => {
      console.error(
        `Shutdown error! \nMore info: ${error} \nFinished at: ${new Date().toISOString()}`
      )
    })
}

ON_DEATH(() => gracefullyShutDown())

export { server, apolloServer, boot }
