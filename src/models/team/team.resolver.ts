import Team from "./team.model"
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from "type-graphql"
import Context from "../../common/types/context"
import User from "../user/user.model"
import { raw } from "objection"
import { CreateTeamResponse } from "./types/createTeam"

@Resolver(Team)
export default class TeamResolver {
  @Authorized()
  @Mutation(() => CreateTeamResponse)
  async createTeam(@Arg("name") name: string, @Ctx() ctx: Context): Promise<CreateTeamResponse> {
    const currentUser = await ctx.getUser()

    const existingTeam = await currentUser
      .$relatedQuery("ownTeams")
      .findOne(raw("LOWER(name)"), name.toLowerCase())
    if (!!existingTeam) {
      return { exists: true }
    }

    const newTeam = { name } as Team
    return { team: await currentUser.$relatedQuery("ownTeams").insert(newTeam) }
  }

  @Authorized()
  @Mutation(() => Boolean, { nullable: true })
  async deleteTeam(@Arg("id") id: string, @Ctx() ctx: Context) {
    return (await User.relatedQuery("ownTeams").for(ctx.getUserId()).deleteById(id)) > 0
  }
}
