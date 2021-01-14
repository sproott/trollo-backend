import queryComplexity, {
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from "graphql-query-complexity"

import { ApolloServerExpressConfig } from "apollo-server-express"
import { GraphQLSchema } from "graphql"
import buildContext from "./buildContext"
import { buildSchema } from "type-graphql"
import createSubscriptionOnConnect from "./createSubscriptionOnConnect"
import customAuthChecker from "../auth/authChecker"
import express from "express"
import { isProduction } from "../common/lib/util"

const MAX_COMPLEXITY = 40

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
    plugins: [
      {
        requestDidStart: () => ({
          didResolveOperation({ request, document }) {
            const complexity = getComplexity({
              schema,
              operationName: request.operationName,
              query: document,
              variables: request.variables,
              estimators: [fieldExtensionsEstimator(), simpleEstimator({ defaultComplexity: 1 })],
            })
            if (complexity > MAX_COMPLEXITY) {
              throw new Error(
                `Too complicated query! ${complexity} is over ${MAX_COMPLEXITY}, the max allowed complexity.`
              )
            }
          },
        }),
      },
    ],
  }

  return configuration
}
