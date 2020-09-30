import { Strategy as PassportStrategy } from "passport-strategy"
import { Inject } from "typescript-ioc"
import { UserService } from "../user/user.service"
import PassportStrategyType from "./enum/PassportStrategyType"
import express from "express"
import { LoginInput } from "../user/user.input"
import User from "../user/user.model"
import S from "string"
import { Done } from "../init/buildContext"
import { compare } from "../common/lib/crypt"

export default class GraphqlCredentialsStrategy extends PassportStrategy {
  @Inject
  userService: UserService

  name: string

  constructor() {
    super()
    this.name = PassportStrategyType.CREDENTIALS_STRATEGY
  }

  async verify(req: express.Request, input: LoginInput, done: Done): Promise<void> {
    let { usernameOrEmail, password } = input
    let user: User
    if (S(usernameOrEmail).contains("@")) {
      user = (await this.userService.findByEmail(usernameOrEmail))[0]
    } else {
      user = (await this.userService.findByUsername(usernameOrEmail))[0]
    }
    if (!user) {
      done(new Error("User doesn't exist"), null)
      return
    }
    const success = await compare(password, user.password)
    if (success) {
      done(null, user)
    } else {
      done(new Error("Incorrect password"), null)
    }
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
