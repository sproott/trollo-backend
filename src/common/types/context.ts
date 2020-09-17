import LoaderContainer from "../loader/loaderContainer"
import User from "../../user/user.model"
import { LoginInput } from "../../user/user.input"
import passport, { AuthenticateOptions } from "passport"
import S from "string"
import { Crypt } from "../crypt"
import express from "express"
import { Inject } from "typescript-ioc"
import { UserService } from "../../user/user.service"
import { Strategy as PassportStrategy } from "passport-strategy"

export default interface Context {
  isAuthenticated: () => boolean
  isUnauthenticated: () => boolean
  getUser: () => User

  authenticate(
    strategyName: string,
    options: LoginInput
  ): Promise<AuthenticateReturn>

  login: (user: User, options?: AuthenticateOptions) => void
  logout: () => void
  loaderContainer: LoaderContainer
}

export class GraphqlCredentialsStrategy extends PassportStrategy {
  @Inject
  userService: UserService

  name: string

  constructor() {
    super()
    this.name = "graphql-credentials-strategy"
  }

  async verify(req: express.Request, input: LoginInput, done: Done) {
    let { usernameOrEmail, password } = input
    let user: User
    if (S(usernameOrEmail).contains("@")) {
      user = await this.userService.findByEmail(usernameOrEmail)
    } else {
      user = await this.userService.findByUsername(usernameOrEmail)
    }
    if (!user) {
      throw new Error("User doesn't exist")
    }
    return Crypt.compare(password, user.password).then((success) => {
      if (success) {
        done(null, user)
      } else {
        done(new Error("Incorrect password"), null)
      }
    })
  }

  authenticate(req: express.Request, options?: any): any {
    const done: Done = (err?, user?, info?) => {
      if (err) {
        return this.error(err)
      }
      if (!user) {
        return this.fail(info.message, 401)
      }
      return this.success(user, info)
    }

    this.verify(req, options, done)
  }
}

export function buildContext(req: CommonRequest, res: express.Response) {
  return {
    isAuthenticated: () => req.isAuthenticated(),
    isUnauthenticated: () => req.isUnauthenticated(),
    getUser: () => req.user,
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

type Done = (err?: Error, user?: User, info?: IVerifyOptions) => void

export interface CommonRequest
  extends Pick<Context, "isAuthenticated" | "isUnauthenticated" | "logout">,
    express.Request {
  user?: User
}

export interface AuthenticateReturn {
  user?: User
  info?: IVerifyOptions
}

export interface IVerifyOptions {
  info: boolean
  message?: string
}
