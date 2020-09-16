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

let server, apolloServer

async function init() {
	// init knex
	Model.knex(knex)

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
			console.info(
				`GraphQL server ready at http://localhost:4000${apolloServer.graphqlPath}`
			)
			resolve()
		})
	})
}

const boot = init()

boot.catch((err) => {
	console.error("Server failed to start", err)
})

export { server, apolloServer, boot }
