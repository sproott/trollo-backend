import LoaderContainer from "../loader/loaderContainer"
import User from "../../models/user/user.model"
import { LoginInput } from "../../models/user/user.input"
import { AuthenticateOptions } from "passport"
import { AuthenticateReturn } from "../../init/buildContext"
import express from "express"

export default interface Context {
  isAuthenticated: () => boolean
  isUnauthenticated: () => boolean
  getUser: () => Promise<User>
  userId: string

  authenticate(strategyName: string, options: LoginInput): Promise<AuthenticateReturn>

  login: (user: User, options?: AuthenticateOptions) => void
  logout: () => void
  loaderContainer: LoaderContainer
  req: express.Request
}
