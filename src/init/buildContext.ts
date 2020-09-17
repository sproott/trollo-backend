import express from "express"
import User from "../user/user.model"
import passport, { AuthenticateOptions } from "passport"
import LoaderContainer from "../common/loader/loaderContainer"
import UserWrapper from "../user/userWrapper"

export default function buildContext(req: express.Request, res: express.Response) {
  return {
    isAuthenticated: () => req.isAuthenticated(),
    isUnauthenticated: () => req.isUnauthenticated(),
    getUser: async () => {
      return await (req.user as UserWrapper)?.getUser()
    },
    authenticate: (strategyName: string, options: AuthenticateOptions) => {
      return new Promise<AuthenticateReturn>((resolve, reject) => {
        const done = (err?: Error, user?: User, info?: IVerifyOptions) => {
          if (err) reject(err)
          else resolve({ user, info })
        }
        const authFn = passport.authenticate(strategyName, options, done)
        return authFn(req, res)
      })
    },
    login: (user: User, options?: AuthenticateOptions) => {
      return new Promise<void>((resolve, reject) => {
        const done = (err?: Error) => {
          if (err) reject(err)
          else resolve()
        }
        req.login(user, options, done)
      })
    },
    logout: () => req.logout(),
    req,
    loaderContainer: new LoaderContainer(),
  }
}

export type Done = (err?: Error, user?: User, info?: IVerifyOptions) => void

export interface AuthenticateReturn {
  user?: User
  info?: IVerifyOptions
}

export interface IVerifyOptions {
  info: boolean
  message?: string
}
