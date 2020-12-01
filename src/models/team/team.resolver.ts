import Team from "./team.model"
import { Arg, Authorized, Ctx, Mutation, Resolver } from "type-graphql"
import Context from "../../common/types/context"
import { raw } from "objection"
import CreateTeamResponse from "./types/createTeam"
import { Participant } from "../participant/participant.model"
import TeamService from "./team.service"
import { Inject } from "typescript-ioc"
import RenameTeamResponse from "./types/renameTeam"

@Resolver(Team)
export default class TeamResolver {
  @Inject
  private teamService: TeamService

  @Authorized()
  @Mutation(() => CreateTeamResponse)
  async createTeam(@Arg("name") name: string, @Ctx() ctx: Context): Promise<CreateTeamResponse> {
    if (name.length == 0) throw new Error("Name is empty")
    const existingTeam = await this.teamService
      .ownTeams(ctx.userId)
      .findOne(raw('LOWER("team"."name")'), name.toLowerCase())
    if (!!existingTeam) {
      return { exists: true }
    }

    const newTeam = await Team.query().insertAndFetch({ name })
    await Participant.query().insert({ user_id: ctx.userId, team_id: newTeam.id, owner: true })
    return { team: newTeam }
  }

  @Authorized()
  @Mutation(() => Boolean, { nullable: true })
  async deleteTeam(@Arg("id") id: string, @Ctx() ctx: Context) {
    return (
      (await Team.query()
        .delete()
        .whereIn("team.id", this.teamService.ownTeams(ctx.userId).select("team.id"))
        .andWhere("team.id", id)) > 0
    )
  }

  @Authorized()
  @Mutation(() => RenameTeamResponse)
  async renameTeam(@Arg("teamId") teamId: string, @Arg("name") name: string, @Ctx() ctx: Context) {
    if (name.length == 0) throw new Error("Name is empty")
    const existingTeam = await this.teamService
      .ownTeams(ctx.userId)
      .where(raw("LOWER(team.name)"), name.toLowerCase())
    if (!!existingTeam) {
      return { exists: true }
    }
    const affected = await Team.query()
      .patch({ name })
      .whereIn("id", this.teamService.ownTeam(ctx.userId, teamId).select("team.id"))
    return { success: affected > 0 }
  }
}
