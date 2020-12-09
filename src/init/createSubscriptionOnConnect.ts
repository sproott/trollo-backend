import { Response } from "express"
import { IncomingMessage } from "http"
import ws from "ws"

interface WebSocket<Request extends {} = Express.Request> extends ws {
  upgradeReq: IncomingMessage & Request
}

type MiddlewareFns = (
  req: WebSocket["upgradeReq"],
  res: Response,
  resolve: (r: { req: WebSocket }) => unknown
) => void
interface ReturnOnConnect {
  req: WebSocket["upgradeReq"]
}

const executeMiddlewares = (
  middlewares: MiddlewareFns[],
  webSocket: WebSocket,
  resolve: (value: ReturnOnConnect | PromiseLike<ReturnOnConnect>) => void
) => {
  if (middlewares.length === 0) {
    const { upgradeReq } = webSocket
    resolve({ req: upgradeReq })
  } else {
    const nextMiddleware = middlewares[0]
    const remainingMiddlewares = middlewares.slice(1)
    const response = {} as Response
    nextMiddleware(webSocket.upgradeReq, response, () =>
      executeMiddlewares(remainingMiddlewares, webSocket, resolve)
    )
  }
}

const createSubscriptionOnConnect = <T extends ReturnOnConnect>(middlewares: MiddlewareFns[]) => {
  // This is called on each message that has a GQL_CONNECTION_INIT message type
  return (connectionParams: Object, webSocket: WebSocket) =>
    new Promise<T>((resolve) => executeMiddlewares(middlewares, webSocket, resolve))
}

export default createSubscriptionOnConnect
