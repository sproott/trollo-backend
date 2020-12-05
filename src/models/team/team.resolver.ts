import Team from "./team.model"
import { Arg, Authorized, Ctx, Mutation, Resolver } from "type-graphql"
import Context from "../../common/types/context"
import { raw } from "objection"
import CreateTeamResponse from "./types/createTeam"
import { Participant } from "../participant/participant.model"
import TeamService from "./team.service"
import { Inject } from "typescript-ioc"
import UserService from "../user/user.service"
import AddUserResponse from "./types/addUser"
import { RenameResponse } from "../../common/types/objectTypes"

@Resolver(Team)
export default class TeamResolver {
  @Inject
  private teamService: TeamService
  @Inject
  private userService: UserService

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
  @Mutation(() => Boolean)
  async deleteTeam(@Arg("id") id: string, @Ctx() ctx: Context) {
    return (
      (await Team.query()
        .delete()
        .whereIn("team.id", this.teamService.ownTeams(ctx.userId).select("team.id"))
        .andWhere("team.id", id)) > 0
    )
  }

  @Authorized()
  @Mutation(() => RenameResponse)
  async renameTeam(
    @Arg("teamId") teamId: string,
    @Arg("name") name: string,
    @Ctx() ctx: Context
  ): Promise<RenameResponse> {
    if (name.length == 0) throw new Error("Name is empty")
    const existingTeam = await this.teamService
      .ownTeams(ctx.userId)
      .findOne(raw("LOWER(team.name)"), name.toLowerCase())
    if (!!existingTeam) {
      if (existingTeam.id === teamId) return { success: true }
      else return { exists: true }
    }
    const affected = await Team.query()
      .patch({ name })
      .whereIn("id", this.teamService.ownTeam(ctx.userId, teamId).select("team.id"))
    return { success: affected > 0 }
  }

  @Authorized()
  @Mutation(() => AddUserResponse)
  async addUser(
    @Arg("teamId") teamId: string,
    @Arg("username") username: string,
    @Ctx() ctx: Context
  ): Promise<AddUserResponse> {
    if (username.length === 0) throw new Error("Username is empty")
    const team = await this.teamService.ownTeam(ctx.userId, teamId)
    if (!team) throw new Error("Team not found")
    const user = await this.userService.findByUsername(username)
    if (!user) return { doesNotExist: true }
    if (user.id === ctx.userId) {
      return {}
    }
    const userInTeam = await Participant.query()
      .findOne("user_id", user.id)
      .andWhere("team_id", team.id)
    if (!!userInTeam) {
      return { alreadyInTeam: true }
    }
    await Participant.query().insert({ user_id: user.id, team_id: team.id, owner: false })
    return { userId: user.id, username: user.username }
  }

  @Authorized()
  @Mutation(() => Boolean)
  async removeUser(
    @Arg("userId") userId: string,
    @Arg("teamId") teamId: string,
    @Ctx() ctx: Context
  ) {
    const team = await this.teamService.ownTeam(ctx.userId, teamId)
    if (!team) throw new Error("Team not found")
    if (userId === ctx.userId) {
      throw new Error("Cannot remove self")
    }
    const affected = await Participant.query()
      .delete()
      .where("user_id", userId)
      .andWhere("team_id", teamId)
    return affected > 0
  }
}
