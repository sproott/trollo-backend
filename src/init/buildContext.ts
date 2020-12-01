import express from "express"
import User from "../models/user/user.model"
import passport, { AuthenticateOptions } from "passport"
import LoaderContainer from "../common/loader/loaderContainer"
import UserWrapper from "../models/user/userWrapper"
import { LoginInput } from "../models/user/user.input"
import Context from "../common/types/context"

export default function buildContext(req: express.Request, res: express.Response): Context {
  return {
    isAuthenticated: () => req.isAuthenticated(),
    isUnauthenticated: () => req.isUnauthenticated(),
    getUser: () => (req.user as UserWrapper)?.getUser(),
    userId: (req.user as UserWrapper).id,
    authenticate: (strategyName: string, options: LoginInput) => {
      return new Promise<AuthenticateReturn>((resolve, reject) => {
        const done = (err?: Error, user?: User, info?: IVerifyOptions) => {
          if (err) reject(err)
          else resolve({ user, info })
        }
        const authFn = passport.authenticate(strategyName, options as AuthenticateOptions, done)
        return authFn(req, res)
      })
    },
    login: (user: User, options?: AuthenticateOptions) => {
      return new Promise<void>((resolve, reject) => {
        const done = (err?: Error) => {
          if (err) reject(err)
          else resolve()
        }
        req.login(new UserWrapper(user.id), options, done)
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
