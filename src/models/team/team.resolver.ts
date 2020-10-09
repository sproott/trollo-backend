import Team from "./team.model"
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from "type-graphql"
import Context from "../../common/types/context"
import User from "../user/user.model"
import { raw } from "objection"

@Resolver(Team)
export default class TeamResolver {
  @Authorized()
  @Mutation(() => Team, { nullable: true })
  async createTeam(@Arg("name") name: string, @Ctx() ctx: Context) {
    const currentUser = await ctx.getUser()

    const existingTeam = await currentUser
      .$relatedQuery("ownTeams")
      .findOne(raw("LOWER(name)"), name.toLowerCase())
    if (!!existingTeam) {
      return null
    }

    const newTeam = { name } as Team
    return currentUser.$relatedQuery("ownTeams").insert(newTeam)
  }

  @Authorized()
  @Mutation(() => Boolean, { nullable: true })
  async deleteTeam(@Arg("id") id: string, @Ctx() ctx: Context) {
    return (await User.relatedQuery("ownTeams").for(ctx.getUserId()).deleteById(id)) > 0
  }
}
