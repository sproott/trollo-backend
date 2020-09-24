import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql"
import User from "./user.model"
import { LoginInput, RegisterInput } from "./user.input"
import { Inject } from "typescript-ioc"
import { UserService } from "./user.service"
import Context from "../common/types/context"
import PassportStrategyType from "../auth/enum/PassportStrategyType"
import { crypt } from "../common/lib/crypt"
import { RegisterError, RegisterResponse } from "./types/registerError"

@Resolver(User)
export default class UserResolver {
  @Inject
  userService: UserService

  @Query(() => User)
  async user(@Arg("id") id: number) {
    return this.userService.findById(id)
  }

  @Query(() => User, { nullable: true })
  async currentUser(@Ctx() ctx: Context) {
    return ctx.getUser()
  }

  @Query(() => [User])
  async users() {
    return User.query().select()
  }

  @Mutation(() => User)
  async login(@Arg("input") input: LoginInput, @Ctx() ctx: Context) {
    const { user } = await ctx.authenticate(PassportStrategyType.CREDENTIALS_STRATEGY, input)
    await ctx.login(user)
    return user
  }

  @Mutation(() => Number, { nullable: true })
  async logout(@Ctx() ctx: Context) {
    const id = (await ctx.getUser())?.id
    ctx.logout()
    return id
  }

  @Mutation(() => RegisterResponse)
  async register(@Arg("input") input: RegisterInput, @Ctx() ctx: Context) {
    const error: RegisterError = new RegisterError()
    const response = new RegisterResponse()
    let throwError = false
    const foundEmail = !!(await this.userService.findByEmail(input.email))
    if (foundEmail) {
      error.email = true
      throwError = true
    }
    const foundUsername = !!(await this.userService.findByUsername(input.username))
    if (foundUsername) {
      error.username = true
      throwError = true
    }

    if (throwError) {
      response.error = error
      return response
    }

    const user: User = await this.userService.insertOne({
      ...input,
      password: await crypt.hash(input.password),
    } as User)
    await ctx.login(user)
    response.user = user
    return response
  }
}
