import Team from "./team.model"
import {
  Arg,
  Authorized,
  Ctx,
  Int,
  Mutation,
  Publisher,
  PubSub,
  Resolver,
  ResolverFilterData,
  Root,
  Subscription,
} from "type-graphql"
import Context from "../../common/types/context"
import { raw } from "objection"
import CreateTeamResponse from "./types/createTeam"
import { Participant } from "../participant/participant.model"
import TeamService from "./team.service"
import { Inject } from "typescript-ioc"
import UserService from "../user/user.service"
import AddUserResponse from "./types/addUser"
import { RenameResponse } from "../../common/types/objectTypes"
import CardService from "../card/card.service"
import Notification from "../../common/types/notification"
import teamFilter from "./team.filter"
import { TeamDeletedPayload } from "./types/teamDeleted"

@Resolver(Team)
export default class TeamResolver {
  @Inject
  private teamService: TeamService
  @Inject
  private userService: UserService
  @Inject
  private cardService: CardService

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
  async deleteTeam(
    @Arg("id") id: string,
    @Ctx() ctx: Context,
    @PubSub(Notification.TEAM_DELETED) publish: Publisher<TeamDeletedPayload>
  ) {
    const participantIds = (await Participant.query().where("team_id", id).select("user_id")).map(
      (p) => p.user_id
    )
    const affected = await Team.query()
      .delete()
      .whereIn("team.id", this.teamService.ownTeams(ctx.userId).select("team.id"))
      .andWhere("team.id", id)
    if (affected > 0) {
      await publish({
        teamId: id,
        participantIds,
      })
      return true
    }
    return false
  }

  @Authorized()
  @Subscription(() => String, {
    topics: Notification.TEAM_DELETED,
    filter: ({ context, payload }: ResolverFilterData<TeamDeletedPayload, any, Context>) =>
      !!payload.participantIds.find((id) => id === context.userId),
  })
  async teamDeleted(@Root() payload: TeamDeletedPayload) {
    return payload.teamId
  }

  @Authorized()
  @Mutation(() => RenameResponse)
  async renameTeam(
    @Arg("teamId") teamId: string,
    @Arg("name") name: string,
    @Ctx() ctx: Context,
    @PubSub(Notification.TEAM_RENAMED) publish: Publisher<Team>
  ): Promise<RenameResponse> {
    if (name.length == 0) throw new Error("Name is empty")
    const existingTeam = await this.teamService
      .ownTeams(ctx.userId)
      .findOne(raw("LOWER(team.name)"), name.toLowerCase())
    if (!!existingTeam) {
      if (existingTeam.id === teamId) return { success: true }
      else return { exists: true }
    }
    const affectedTeam = (
      await Team.query()
        .patch({ name })
        .whereIn("id", this.teamService.ownTeam(ctx.userId, teamId).select("team.id"))
        .returning("team.*")
    )[0]
    await publish(affectedTeam)
    return { success: !!affectedTeam }
  }

  @Authorized()
  @Subscription(() => Team, {
    topics: Notification.TEAM_RENAMED,
    filter: teamFilter,
  })
  async teamRenamed(@Root() team: Team) {
    return team
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
    const affected = await this.teamService.removeUser(team, userId)
    return affected > 0
  }

  @Authorized()
  @Mutation(() => Boolean)
  async leaveTeam(@Arg("teamId") teamId: string, @Ctx() ctx: Context) {
    const team = await this.teamService.teams(ctx.userId, false).findById(teamId)
    if (!team) throw new Error("Team not found")
    const affected = await this.teamService.removeUser(team, ctx.userId)
    return affected > 0
  }
}
