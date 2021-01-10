import Flair from "./flair.model"
import {
  Arg,
  Args,
  Authorized,
  Ctx,
  Int,
  Mutation,
  Publisher,
  PubSub,
  Resolver,
  Root,
  Subscription,
} from "type-graphql"
import { CreateFlairResponse, CreateFlairInput as CreateFlairArgs } from "./types/createFlair"
import { raw } from "objection"
import Notification from "../../common/types/notification"
import { FlairIdTeamIdPayload, FlairTeamIdPayload } from "./types/subscriptionPayloads"
import { teamParticipantFilter } from "../team/team.filter"
import FlairService from "./flair.service"
import { Inject } from "typescript-ioc"
import Context from "../../common/types/context"
import { ConditionFuncData, filterFunc } from "../../common/lib/filterFunc"
import { TeamIdArgs } from "../../common/types/argTypes"
import { RenameResponse } from "../../common/types/objectTypes"

const flairTeamIdFilter = filterFunc(
  (p) => p.team_id,
  teamParticipantFilter,
  ({ filterResult, payload, args }: ConditionFuncData<Flair, TeamIdArgs>) =>
    filterResult && payload.team_id === args.teamId
)

@Resolver(Flair)
export default class FlairResolver {
  @Inject
  private flairService: FlairService

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

  @Authorized()
  @Subscription(() => Flair, {
    topics: Notification.FLAIR_CREATED,
    filter: flairTeamIdFilter,
  })
  async flairCreated(@Arg("teamId") teamId: string, @Root() payload: Flair) {
    return payload
  }

  @Authorized()
  @Mutation(() => Boolean)
  async changeFlairHue(
    @Arg("flairId") flairId: string,
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
    @Arg("flairId") flairId: string,
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
    if (!!existingFlair) return { exists: true }
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

  @Authorized()
  @Subscription(() => Flair, {
    topics: Notification.FLAIR_UPDATED,
    filter: flairTeamIdFilter,
  })
  async flairUpdated(@Arg("teamId") teamId: string, @Root() payload: Flair) {
    return payload
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deleteFlair(
    @Arg("flairId") flairId: string,
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

  @Authorized()
  @Subscription(() => FlairIdTeamIdPayload, {
    topics: Notification.FLAIR_DELETED,
    filter: filterFunc(
      (p) => p.teamId,
      teamParticipantFilter,
      ({ filterResult, payload, args }: ConditionFuncData<FlairIdTeamIdPayload, TeamIdArgs>) =>
        filterResult && payload.teamId === args.teamId
    ),
  })
  async flairDeleted(@Arg("teamId") teamId: string, @Root() payload: FlairIdTeamIdPayload) {
    return payload
  }
}
