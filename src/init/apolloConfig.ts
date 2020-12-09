import { GraphQLSchema } from "graphql"
import { buildSchema } from "type-graphql"
import { ApolloServerExpressConfig } from "apollo-server-express"
import buildContext from "./buildContext"
import customAuthChecker from "../auth/authChecker"
import { isProduction } from "../common/lib/util"
import express from "express"
import createSubscriptionOnConnect from "./createSubscriptionOnConnect"

export default async function getApolloConfig(
  dirname: string,
  middlewares: (express.RequestHandler | express.Handler | any)[]
) {
  // build GraphQL schema
  const schema: GraphQLSchema = await buildSchema({
    authChecker: customAuthChecker,
    resolvers: [dirname],
  })

  // configure Apollo
  const configuration: ApolloServerExpressConfig = {
    schema,
    // @ts-ignore
    context: ({ req, res, connection }) => buildContext(req, res, connection),
    playground: !isProduction() && {
      settings: {
        "request.credentials": "include",
      },
    },
    subscriptions: {
      onConnect: createSubscriptionOnConnect(middlewares),
    },
    introspection: !isProduction(),
    tracing: !isProduction(),
  }

  return configuration
}
