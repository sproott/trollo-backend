import Flair from "./flair.model"
import {
  Arg,
  Args,
  Authorized,
  Ctx,
  ID,
  Int,
  Mutation,
  Publisher,
  PubSub,
  Resolver,
  Root,
  Subscription,
} from "type-graphql"
import { CreateFlairResponse, CreateFlairArgs } from "./types/createFlair"
import { raw } from "objection"
import Notification from "../../common/types/notification"
import {
  FlairAssignmentPayload,
  FlairIdCardIdTeamIdPayload,
  FlairIdTeamIdPayload,
} from "./types/subscriptionPayloads"
import { teamParticipantFilter } from "../team/team.filter"
import FlairService from "./flair.service"
import { Inject } from "typescript-ioc"
import Context from "../../common/types/context"
import { TeamIdArgs } from "../../common/types/argTypes"
import { RenameResponse } from "../../common/types/objectTypes"
import CardService from "../card/card.service"
import Role from "../../auth/types/role"
import { and, transform } from "../../common/lib/filterFunc"

const flairTeamIdFilter = and<Flair, TeamIdArgs>(
  transform((p) => p.team_id, teamParticipantFilter),
  ({ payload, args }) => payload.team_id === args.teamId
)

@Resolver(Flair)
export default class FlairResolver {
  @Inject
  private flairService: FlairService
  @Inject
  private cardService: CardService

  @Authorized()
  @Mutation(() => CreateFlairResponse)
  async createFlair(
    @Args() { name, hue, teamId }: CreateFlairArgs,
    @PubSub(Notification.FLAIR_CREATED) publish: Publisher<Flair>
  ): Promise<CreateFlairResponse> {
    const existingFlair = await Flair.query()
      .where("team_id", teamId)
      .findOne(raw("LOWER(name)"), name.toLowerCase())

    if (!!existingFlair) {
      return { exists: true }
    }

    const newFlair = await Flair.query().insert({
      name,
      hue,
      team_id: teamId,
    })

    await publish(newFlair)
    return { flair: newFlair }
  }

  @Authorized([Role.TEAM])
  @Subscription(() => Flair, {
    topics: Notification.FLAIR_CREATED,
    filter: flairTeamIdFilter,
  })
  async flairCreated(@Arg("teamId", () => ID) teamId: string, @Root() payload: Flair) {
    return payload
  }

  @Authorized()
  @Mutation(() => Boolean)
  async changeFlairHue(
    @Arg("flairId", () => ID) flairId: string,
    @Arg("hue", () => Int) hue: number,
    @Ctx() ctx: Context,
    @PubSub(Notification.FLAIR_UPDATED) publish: Publisher<Flair>
  ) {
    if (hue < 0 || hue > 360) throw new Error("Hue out of bounds")

    const affectedFlair = (
      await Flair.query()
        .patch({ hue })
        .where("flair.id", this.flairService.flair(ctx.userId, flairId).select("flair.id"))
        .returning("flair.*")
    )[0]
    if (!!affectedFlair) {
      await publish(affectedFlair)
      return true
    }
  }

  @Authorized()
  @Mutation(() => RenameResponse)
  async renameFlair(
    @Arg("flairId", () => ID) flairId: string,
    @Arg("name") name: string,
    @Ctx() ctx: Context,
    @PubSub(Notification.FLAIR_UPDATED) publish: Publisher<Flair>
  ): Promise<RenameResponse> {
    if (name.length == 0) throw new Error("Name empty")
    if (name.length > 20) throw new Error("Name too long")

    const flair = await this.flairService.flair(ctx.userId, flairId)
    if (!flair) throw new Error("Flair does not exist")
    const existingFlair = await this.flairService
      .flairs(ctx.userId)
      .where("flair.team_id", flair.team_id)
      .findOne(raw("LOWER(flair.name)"), name.toLowerCase())
    if (existingFlair) return { exists: true }
    const affectedFlair = (
      await Flair.query()
        .patch({ name })
        .where("flair.id", this.flairService.flair(ctx.userId, flairId).select("flair.id"))
        .returning("flair.*")
    )[0]
    if (!!affectedFlair) {
      await publish(affectedFlair)
      return { success: true }
    }
    return { success: false }
  }

  @Authorized([Role.TEAM])
  @Subscription(() => Flair, {
    topics: Notification.FLAIR_UPDATED,
    filter: flairTeamIdFilter,
  })
  async flairUpdated(@Arg("teamId", () => ID) teamId: string, @Root() payload: Flair) {
    return payload
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deleteFlair(
    @Arg("flairId", () => ID) flairId: string,
    @Ctx() ctx: Context,
    @PubSub(Notification.FLAIR_DELETED) publish: Publisher<FlairIdTeamIdPayload>
  ) {
    const flair = await this.flairService.flair(ctx.userId, flairId)
    if (flair) {
      await Flair.query().deleteById(flairId)
      await publish({ flairId, teamId: flair.team_id })
      return true
    } else {
      return false
    }
  }

  @Authorized([Role.TEAM])
  @Subscription(() => FlairIdTeamIdPayload, {
    topics: Notification.FLAIR_DELETED,
    filter: and<FlairIdTeamIdPayload, TeamIdArgs>(
      transform((p) => p.teamId, teamParticipantFilter),
      ({ payload, args }) => payload.teamId === args.teamId
    ),
  })
  async flairDeleted(
    @Arg("teamId", () => ID) teamId: string,
    @Root() payload: FlairIdTeamIdPayload
  ) {
    return payload
  }

  @Authorized()
  @Mutation(() => Boolean)
  async assignFlair(
    @Arg("cardId", () => ID) cardId: string,
    @Arg("flairId", () => ID) flairId: string,
    @Ctx() ctx: Context,
    @PubSub(Notification.FLAIR_ASSIGNED) publish: Publisher<FlairAssignmentPayload>
  ) {
    const flair = await this.flairService.flair(ctx.userId, flairId)
    if (!flair) return false
    const card = await this.cardService
      .card(ctx.userId, cardId)
      .withGraphJoined("list.[board.[team]]")
      .where("list:board:team.id", flair.team_id)
    if (!card) return false
    await card.$relatedQuery("flairs").relate(flair)
    await publish({ flairId, cardId, teamId: flair.team_id, userId: ctx.userId })
    return true
  }

  @Authorized([Role.TEAM])
  @Subscription(() => FlairIdCardIdTeamIdPayload, {
    topics: Notification.FLAIR_ASSIGNED,
    filter: and<FlairAssignmentPayload, TeamIdArgs>(
      transform((p) => p.teamId, teamParticipantFilter),
      ({ payload, args, context }) =>
        payload.teamId === args.teamId && payload.userId !== context.userId
    ),
  })
  async flairAssigned(
    @Arg("teamId", () => ID) teamId: string,
    @Root() payload: FlairAssignmentPayload
  ): Promise<FlairIdCardIdTeamIdPayload> {
    return payload
  }

  @Authorized()
  @Mutation(() => Boolean)
  async unassignFlair(
    @Arg("cardId", () => ID) cardId: string,
    @Arg("flairId", () => ID) flairId: string,
    @Ctx() ctx: Context,
    @PubSub(Notification.FLAIR_UNASSIGNED) publish: Publisher<FlairAssignmentPayload>
  ) {
    const flair = await this.flairService.flair(ctx.userId, flairId)
    if (!flair) return false
    const card = await this.cardService
      .card(ctx.userId, cardId)
      .withGraphJoined("list.[board.[team]]")
      .where("list:board:team.id", flair.team_id)
    if (!card) return false
    await card.$relatedQuery("flairs").unrelate().where("flair_id", flairId)
    await publish({ flairId, cardId, teamId: flair.team_id, userId: ctx.userId })
    return true
  }

  @Authorized([Role.TEAM])
  @Subscription(() => FlairIdCardIdTeamIdPayload, {
    topics: Notification.FLAIR_UNASSIGNED,
    filter: and<FlairAssignmentPayload, TeamIdArgs>(
      transform((p) => p.teamId, teamParticipantFilter),
      ({ payload, args, context }) =>
        payload.teamId === args.teamId && payload.userId !== context.userId
    ),
  })
  async flairUnassigned(
    @Arg("teamId", () => ID) teamId: string,
    @Root() payload: FlairAssignmentPayload
  ): Promise<FlairIdCardIdTeamIdPayload> {
    return payload
  }
}
