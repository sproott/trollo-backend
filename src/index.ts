import "reflect-metadata"
import { buildSchema } from "type-graphql"
import { GraphQLSchema } from "graphql"
import { Model } from "objection"
import { knex } from "../db/knex"
import express from "express"
import session from "express-session"
import { v4 as uuid } from "uuid"
import passport from "passport"
import { ApolloServer, ApolloServerExpressConfig } from "apollo-server-express"
import { buildContext } from "graphql-passport"
import User from "./user/user.model"
import LoaderContainer from "./common/loader/loaderContainer"
import initPassport from "./common/loginStrategy"

let server, apolloServer

async function init() {
	// init knex
	Model.knex(knex)

	// build GraphQL schema
	const schema: GraphQLSchema = await buildSchema({
		resolvers: [__dirname + "/**/*.resolver.ts"],
	})

	// configure Apollo
	const configuration: ApolloServerExpressConfig = {
		schema,
		context: ({ req, res }) =>
			buildContext({
				req,
				res,
				User,
				loaderContainer: new LoaderContainer(),
			}),
		playground: process.env.NODE_ENV !== "production" && {
			settings: {
				"request.credentials": "include",
			},
		},
		introspection: process.env.NODE_ENV !== "production",
		tracing: process.env.NODE_ENV !== "production",
	}

	apolloServer = new ApolloServer(configuration)

	// initialize Passport
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
