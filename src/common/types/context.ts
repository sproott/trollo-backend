import LoaderContainer from "../loader/loaderContainer"
import User from "../../user/user.model"
import { LoginInput } from "../../user/user.input"
import { AuthenticateOptions } from "passport"
import { AuthenticateReturn } from "../../init/buildContext"

export default interface Context {
  isAuthenticated: () => boolean
  isUnauthenticated: () => boolean
  getUser: () => User

  authenticate(strategyName: string, options: LoginInput): Promise<AuthenticateReturn>

  login: (user: User, options?: AuthenticateOptions) => void
  logout: () => void
  loaderContainer: LoaderContainer
}
