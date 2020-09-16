import { GraphQLSchema } from "graphql"
import { buildSchema } from "type-graphql"
import { ApolloServerExpressConfig } from "apollo-server-express"
import { buildContext } from "graphql-passport"
import User from "../user/user.model"
import LoaderContainer from "../common/loader/loaderContainer"

export default async function getApolloConfig(dirname: string) {
	// build GraphQL schema
	const schema: GraphQLSchema = await buildSchema({
		resolvers: [dirname],
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

	return configuration
}
