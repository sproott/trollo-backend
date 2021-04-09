import { Done } from "../init/buildContext"
import { Inject } from "typescript-ioc"
import { LoginInput } from "../models/user/user.input"
import { Strategy as PassportStrategy } from "passport-strategy"
import PassportStrategyType from "./enum/PassportStrategyType"
import User from "../models/user/user.model"
import UserService from "../models/user/user.service"
import { compare } from "../common/lib/crypt"
import express from "express"

export default class GraphqlCredentialsStrategy extends PassportStrategy {
  @Inject
  private userService: UserService

  name: string

  constructor() {
    super()
    this.name = PassportStrategyType.CREDENTIALS_STRATEGY
  }

  async verify(_: express.Request, input: LoginInput, done: Done): Promise<void> {
    let { usernameOrEmail, password } = input
    let user: User
    if (usernameOrEmail.includes("@")) {
      user = await this.userService.findByEmail(usernameOrEmail)
    } else {
      user = await this.userService.findByUsername(usernameOrEmail)
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
