import "reflect-metadata"

import * as http from "http"

import { isProduction, sleep } from "./common/lib/util"

import { ApolloServer } from "apollo-server-express"
import { Model } from "objection"
import ON_DEATH from "death"
import cors from "cors"
import express from "express"
import getApolloConfig from "./init/apolloConfig"
import initPassport from "./init/initPassport"
import { knex } from "../db/knex"
import passport from "passport"
import session from "express-session"
import { v4 as uuid } from "uuid"

const KnexSessionStore = require("connect-session-knex")(session)

let server: any, apolloServer: any

async function init() {
  // init knex
  Model.knex(knex)

  if (isProduction()) {
    await knex.migrate.latest()
    // await knex.seed.run()
  }

  const store = new KnexSessionStore({
    knex,
    tablename: "sessions",
  })

  // init Passport
  initPassport()

  // create Express app
  const app = express()

  // set up cors
  const corsMiddleware = cors({
    credentials: true,
    origin: ["http://localhost:3000", "https://trollo-frontend.vercel.app"],
  })
  app.use(corsMiddleware)

  // for cookies in deployment
  isProduction() && app.set("trust proxy", 1)

  // add session capability to app
  const sessionMiddleware = session({
    genid: () => uuid(),
    secret: process.env.SESSION_SECRET ?? "y-L%@V!*s=A6R4Bv",
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: true,
      secure: isProduction(),
      sameSite: isProduction() ? "none" : undefined,
      maxAge: 1000 * 60 * 60 * 24 * 7 * 365, // 7 years
    },
  })
  app.use(sessionMiddleware)

  // add Passport to app
  const passportMiddleware = passport.initialize()
  const passportSessionMiddleware = passport.session()
  app.use(passportMiddleware)
  app.use(passportSessionMiddleware)

  // init Apollo
  const apolloConfig = await getApolloConfig(__dirname + "/**/*.resolver.*", [
    sessionMiddleware,
    passportMiddleware,
    passportSessionMiddleware,
  ])

  apolloServer = new ApolloServer(apolloConfig)

  // connect Apollo with Express
  apolloServer.applyMiddleware({
    app,
    cors: false,
  })

  const httpServer = http.createServer(app)
  apolloServer.installSubscriptionHandlers(httpServer)

  const port = +(process.env.PORT ?? 4000)

  // start GraphQL server
  return new Promise((resolve, rejects) => {
    server = httpServer.listen(port, isProduction() ? "0.0.0.0" : "localhost", () => {
      console.info(
        `GraphQL server ready at ${process.env.API_BASE_PATH ?? "http://localhost:" + port}${
          apolloServer.graphqlPath
        }`
      )
      resolve(undefined)
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

ON_DEATH(async (signal) => {
  console.info(
    `\nReceived ${signal} signal, gracefully shutting down. \nStarted at: ${new Date().toISOString()}`
  )

  try {
    await apolloServer?.stop()
    console.info(`Shutdown successful! \nFinished at: ${new Date().toISOString()}`)
  } catch (error) {
    console.error(
      `Shutdown error! \nMore info: ${error} \nFinished at: ${new Date().toISOString()}`
    )
  } finally {
    process.exit(0)
  }
})

export { server, apolloServer, boot }
