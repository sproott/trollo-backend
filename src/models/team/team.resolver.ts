import Team from "./team.model"
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from "type-graphql"
import Context from "../../common/types/context"

@Resolver(Team)
export default class TeamResolver {
  @Authorized()
  @Mutation(() => Team, { nullable: true })
  async createTeam(@Arg("name") name: string, @Ctx() ctx: Context) {
    const currentUser = await ctx.getUser()
    const newTeam = { name } as Team
    return currentUser.$relatedQuery("ownTeams").insert(newTeam)
  }
}
