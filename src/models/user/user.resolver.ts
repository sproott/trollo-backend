import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from "type-graphql"
import User from "./user.model"
import { LoginInput, RegisterInput } from "./user.input"
import { Inject } from "typescript-ioc"
import UserService from "./user.service"
import Context from "../../common/types/context"
import PassportStrategyType from "../../auth/enum/PassportStrategyType"
import { RegisterError, RegisterResponse } from "./types/register"
import Role from "../../auth/types/role"
import { hash } from "../../common/lib/crypt"

@Resolver(User)
export default class UserResolver {
  @Inject
  private userService: UserService

  @Authorized(Role.APP_ADMIN)
  @Query(() => User)
  async user(@Arg("id", () => ID) id: string) {
    return this.userService.findById(id)
  }

  @Query(() => User, { nullable: true })
  async currentUser(@Ctx() ctx: Context) {
    return ctx.getUser()
  }

  @Authorized(Role.APP_ADMIN)
  @Query(() => [User])
  async users() {
    return User.query()
  }

  @Mutation(() => User)
  async login(@Arg("input") input: LoginInput, @Ctx() ctx: Context) {
    const { user } = await ctx.authenticate(PassportStrategyType.CREDENTIALS_STRATEGY, input)
    await ctx.login(user)
    return user
  }

  @Authorized()
  @Mutation(() => Boolean, { nullable: true })
  async logout(@Ctx() ctx: Context) {
    ctx.logout()
    return true
  }

  @Mutation(() => RegisterResponse)
  async register(
    @Arg("input") input: RegisterInput,
    @Ctx() ctx: Context
  ): Promise<RegisterResponse> {
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
      password: await hash(input.password),
    } as User)
    await ctx.login(user)
    response.user = user
    return response
  }

  @Authorized(Role.APP_ADMIN)
  @Mutation(() => Boolean)
  async makeAdmin(@Arg("username") username: string) {
    if (username.length == 0) throw new Error("Name is empty")
    const numUpdated = await this.userService.findByUsername(username).patch({
      is_admin: true,
    })

    return numUpdated > 0
  }
}
