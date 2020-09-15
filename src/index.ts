import "reflect-metadata"
import { buildSchema } from "type-graphql"
import { GraphQLSchema } from "graphql"
import { Model } from "objection"
import { knex } from "../db/knex"
import express from "express"
import LoaderContainer from "./common/loader/loaderContainer"
import { ApolloServer, ApolloServerExpressConfig } from "apollo-server-express"

let server, apolloServer

async function init() {
	Model.knex(knex)

	const schema: GraphQLSchema = await buildSchema({
		resolvers: [__dirname + "/**/*.resolver.ts"],
	})

	const configuration: ApolloServerExpressConfig = {
		schema,
		context: () => ({
			loaderContainer: new LoaderContainer(),
		}),
		playground: process.env.NODE_ENV !== "production",
		introspection: process.env.NODE_ENV !== "production",
		tracing: process.env.NODE_ENV !== "production",
	}

	apolloServer = new ApolloServer(configuration)

	const app = express()

	apolloServer.applyMiddleware({ app })

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
