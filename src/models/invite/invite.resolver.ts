import { Arg, Ctx, ID, Mutation, Publisher, PubSub, Query } from "type-graphql"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import Context from "../../common/types/context"
import TeamService from "../team/team.service"
import { Inject } from "typescript-ioc"
import jwt from "jsonwebtoken"
import { Participant } from "../participant/participant.model"
import { TeamUserAddedPayload } from "../team/types/subscriptionPayloads"
import Notification from "../../common/types/notification"
import JoinUsingInviteResponse from "./types/joinUsingInvite"
import Team from "../team/team.model"

dayjs.extend(duration)

type FOREVER = "forever"

type InviteInterval = duration.Duration | FOREVER

const timeIntervals: { [key: string]: InviteInterval } = {
  "30 minutes": dayjs.duration(30, "minutes"),
  "1 hour": dayjs.duration(1, "hour"),
  "6 hours": dayjs.duration(6, "hour"),
  "12 hours": dayjs.duration(12, "hour"),
  "1 day": dayjs.duration(1, "day"),
  "7 days": dayjs.duration(7, "day"),
  forever: "forever",
}

const secret = process.env.JWT_SECRET ?? "=e4r<4E];aTQxB3p"

type InvitePayload = { exp: number; tId: string }

export default class InviteResolver {
  @Inject
  private teamService: TeamService

  @Query(() => [String])
  inviteIntervals() {
    return Object.keys(timeIntervals)
  }

  @Mutation(() => String)
  async generateInvite(
    @Arg("teamId", () => ID) teamId: string,
    @Arg("expiration", () => String) expiration: string,
    @Ctx() ctx: Context
  ) {
    if (!timeIntervals.hasOwnProperty(expiration)) {
      throw new Error("Unknown expiration interval")
    }
    const team = await this.teamService.ownTeam(ctx.userId, teamId)
    if (!team) throw new Error("Own team with this ID does not exist")

    const expirationDate =
      expiration === "forever"
        ? undefined
        : dayjs()
            .add(timeIntervals[expiration] as duration.Duration)
            .unix()

    return jwt.sign(
      Object.assign(
        { tId: teamId },
        expirationDate ? { exp: expirationDate } : {}
      ) as InvitePayload,
      secret
    )
  }

  @Mutation(() => JoinUsingInviteResponse)
  async joinUsingInvite(
    @Arg("token") token: string,
    @Ctx() ctx: Context,
    @PubSub(Notification.TEAM_USER_ADDED) publish: Publisher<TeamUserAddedPayload>
  ): Promise<JoinUsingInviteResponse> {
    const result = ((await new Promise((resolve, reject) =>
      jwt.verify(token, secret, (err, decoded) => {
        if (!err) resolve(decoded)
        reject(err)
      })
    )) as any) as InvitePayload
    const { tId: teamId } = result

    if (!teamId) throw new Error("Token data corrupted")

    const team = await Team.query().findById(teamId)
    if (!team) throw new Error("Team not found")
    const user = await ctx.getUser()

    const userInTeam = await Participant.query()
      .findOne("user_id", user.id)
      .andWhere("team_id", team.id)
    if (!!userInTeam) {
      return { alreadyInTeam: true }
    }

    await Participant.query().insert({ user_id: ctx.userId, team_id: team.id, owner: false })
    await publish({ team, user })

    return { team }
  }
}
