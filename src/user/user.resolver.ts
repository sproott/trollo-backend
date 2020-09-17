import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql"
import User from "./user.model"
import { LoginInput, RegisterInput } from "./user.input"
import { Crypt } from "../common/crypt"
import { Inject } from "typescript-ioc"
import { UserService } from "./user.service"
import Context from "../common/types/context"

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
    const { user } = await ctx.authenticate(
      "graphql-credentials-strategy",
      input
    )
    await ctx.login(user)
    return user
  }

  @Mutation(() => Number, { nullable: true })
  async logout(@Ctx() ctx: Context) {
    const id = ctx.getUser()?.id
    ctx.logout()
    return id
  }

  @Mutation(() => User)
  async register(@Arg("input") input: RegisterInput, @Ctx() ctx: Context) {
    const user: User = await this.userService.insertOne({
      ...input,
      password: await Crypt.hash(input.password),
    } as User)
    await ctx.login(user)
    return user
  }
}
