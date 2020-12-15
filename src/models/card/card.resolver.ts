import {
  Arg,
  Authorized,
  Ctx,
  Int,
  Mutation,
  Publisher,
  PubSub,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql"
import Card from "./card.model"
import { Inject } from "typescript-ioc"
import ListService from "../list/list.service"
import Context from "../../common/types/context"
import CardService from "./card.service"
import { raw } from "objection"
import List from "../list/list.model"
import CreateCardResponse from "./types/createCard"
import { RenameResponse } from "../../common/types/objectTypes"
import { Participant } from "../participant/participant.model"
import Role from "../../auth/types/role"
import {
  CardCreatedPayload,
  CardIdBoardIdPayload,
  CardMovedPayload,
  CardUpdatedPayload,
  CardUserAssignedPayload,
} from "./types/subscriptionPayloads"
import Notification from "../../common/types/notification"
import { boardIdFilter } from "../board/board.filter"
import UserService from "../user/user.service"
import { filterFunc } from "../../common/lib/filterFunc"

@Resolver(Card)
export default class CardResolver {
  @Inject
  private listService: ListService
  @Inject
  private cardService: CardService
  @Inject
  private userService: UserService

  @Authorized()
  @Mutation(() => CreateCardResponse)
  async createCard(
    @Arg("name") name: string,
    @Arg("description", { nullable: true }) description: string,
    @Arg("listId") listId: string,
    @Ctx() ctx: Context,
    @PubSub(Notification.CARD_CREATED) publish: Publisher<CardCreatedPayload>
  ): Promise<CreateCardResponse> {
    if (name.length == 0) throw new Error("Name is empty")
    const list = await this.listService.list(ctx.userId, listId)

    if (!list) {
      throw new Error("List doesn't exist")
    }

    const existingCard = await Card.query()
      .whereIn(
        "list_id",
        List.query().select("list.id").joinRelated("board").where("board.id", list.board_id)
      )
      .findOne(raw("LOWER(name)"), name.toLowerCase())
    if (!!existingCard) {
      return { exists: true }
    }

    const newCard = await Card.query().insert({
      name,
      description,
      index: await this.cardService.nextIndex(ctx.userId, listId),
      list_id: listId,
    })
    await publish({ card: newCard, boardId: list.board_id, listId })
    return { card: newCard }
  }

  @Authorized([Role.BOARD])
  @Subscription(() => CardCreatedPayload, {
    topics: Notification.CARD_CREATED,
    filter: boardIdFilter,
  })
  async cardCreated(@Arg("boardId") boardId: string, @Root() payload: CardCreatedPayload) {
    return payload
  }

  @Authorized()
  @Mutation(() => Boolean)
  async moveCard(
    @Arg("cardId") cardId: string,
    @Arg("listId", { nullable: true }) listId: string,
    @Arg("destinationIndex", () => Int) destinationIndex: number,
    @Ctx() ctx: Context,
    @PubSub(Notification.CARD_MOVED) publish: Publisher<CardMovedPayload>
  ) {
    const card = await this.cardService.card(ctx.userId, cardId).withGraphFetched("list")
    if (!card) throw new Error("Card doesn't exist")

    if (!listId) {
      listId = card.list_id
    } else if (
      listId !== card.list_id &&
      !(await this.listService.list(ctx.userId, listId).where("list.board_id", card.list.board_id))
    ) {
      return false
    }

    const nextIndex = await this.cardService.nextIndex(ctx.userId, listId)

    if (destinationIndex > nextIndex) destinationIndex = nextIndex
    const sourceIndex = card.index

    if (
      listId === card.list_id &&
      (sourceIndex === destinationIndex ||
        (nextIndex === destinationIndex && sourceIndex + 1 === nextIndex))
    )
      return true

    const cards = this.cardService.cards(ctx.userId).where("list_id", listId)

    if (listId === card.list_id) {
      if (sourceIndex < destinationIndex) {
        await cards
          .patch({ index: raw("index - 1") })
          .where("index", ">", sourceIndex)
          .andWhere("index", "<=", destinationIndex)
      } else {
        await cards
          .patch({ index: raw("index + 1") })
          .where("index", "<", sourceIndex)
          .andWhere("index", ">=", destinationIndex)
      }
      await Card.query().patch({ index: destinationIndex }).where("id", cardId)
    } else {
      const sourceCards = this.cardService.cards(ctx.userId).where("list_id", card.list_id)
      await sourceCards.patch({ index: raw("index - 1") }).where("index", ">", sourceIndex)
      await cards.patch({ index: raw("index + 1") }).where("index", ">=", destinationIndex)
      await Card.query().patch({ index: destinationIndex, list_id: listId }).where("id", cardId)
    }
    await publish({
      card,
      boardId: card.list.board_id,
      sourceIndex,
      destinationIndex,
      destinationListId: listId,
      userId: ctx.userId,
    })
    return true
  }

  @Authorized([Role.BOARD])
  @Subscription(() => CardMovedPayload, {
    topics: Notification.CARD_MOVED,
    filter: filterFunc(
      (p) => p,
      boardIdFilter,
      ({ context, payload, filterResult }) => {
        return filterResult && context.userId !== payload.userId
      }
    ),
  })
  async cardMoved(@Arg("boardId") boardId: string, @Root() payload: CardMovedPayload) {
    return payload
  }

  @Authorized()
  @Query(() => Int)
  async nextIndex(@Arg("listId") listId: string, @Ctx() ctx: Context) {
    return this.cardService.nextIndex(ctx.userId, listId)
  }

  @Authorized()
  @Mutation(() => RenameResponse)
  async renameCard(
    @Arg("cardId") cardId: string,
    @Arg("name") name: string,
    @Ctx() ctx: Context,
    @PubSub(Notification.CARD_UPDATED) publish: Publisher<CardUpdatedPayload>
  ): Promise<RenameResponse> {
    if (name.length == 0) throw new Error("Name is empty")
    const card = await this.cardService.card(ctx.userId, cardId)
    if (!card) throw new Error("Card does not exist")
    const existingCard = await this.cardService
      .cards(ctx.userId)
      .where("card.list_id", card.list_id)
      .findOne(raw("LOWER(card.name)"), name.toLowerCase())
    if (!!existingCard) {
      if (existingCard.id === cardId) return { success: true }
      else return { exists: true }
    }
    const affectedCard = (
      await Card.query()
        .patch({ name })
        .withGraphFetched("list")
        .where("card.id", cardId)
        .returning("card.*")
    )[0]
    if (!!affectedCard) {
      await publish({ card: affectedCard, boardId: affectedCard.list.board_id })
      return { success: true }
    }
    return { success: false }
  }

  @Authorized()
  @Mutation(() => Boolean)
  async updateCardDescription(
    @Arg("cardId") cardId: string,
    @Arg("description") description: string,
    @Ctx() ctx: Context,
    @PubSub(Notification.CARD_UPDATED) publish: Publisher<CardUpdatedPayload>
  ) {
    if (description.length == 0) throw new Error("Description is empty")
    const affectedCard = (
      await Card.query()
        .patch({ description })
        .where("card.id", this.cardService.card(ctx.userId, cardId).select("card.id"))
        .returning("card.*")
    )[0]
    if (!!affectedCard) {
      const boardId = ((
        await Card.query().for(cardId).joinRelated("list").select("list.board_id")
      )[0] as unknown) as string
      await publish({ card: affectedCard, boardId })
      return true
    }
  }

  @Authorized([Role.BOARD])
  @Subscription(() => Card, {
    topics: Notification.CARD_UPDATED,
    filter: boardIdFilter,
  })
  async cardUpdated(@Arg("boardId") boardId: string, @Root() payload: CardUpdatedPayload) {
    return payload.card
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deleteCard(
    @Arg("id") id: string,
    @Ctx() ctx: Context,
    @PubSub(Notification.CARD_DELETED) publish: Publisher<CardIdBoardIdPayload>
  ) {
    const card = await this.cardService.card(ctx.userId, id).joinRelated("list")
    if (!card) return false
    await this.cardService.card(ctx.userId, id).delete()
    await this.cardService
      .cards(ctx.userId)
      .where("list_id", card.list_id)
      .andWhere("index", ">", card.index)
      .patch({ index: raw("index - 1") })
    await publish({ cardId: id, boardId: card.list.board_id })
    return true
  }

  @Authorized([Role.BOARD])
  @Subscription(() => CardIdBoardIdPayload, {
    topics: Notification.CARD_DELETED,
    filter: boardIdFilter,
  })
  async cardDeleted(@Arg("boardId") boardId: string, @Root() payload: CardIdBoardIdPayload) {
    return payload
  }

  @Authorized()
  @Mutation(() => Boolean)
  async assignUser(
    @Arg("cardId") cardId: string,
    @Arg("userId") userId: string,
    @Ctx() ctx: Context,
    @PubSub(Notification.CARD_USER_ASSIGNED) publish: Publisher<CardUserAssignedPayload>
  ) {
    const card = await this.cardService.card(ctx.userId, cardId)
    if (!card) {
      throw new Error("Card does not exist")
    }
    const teamId = ((await Card.query()
      .joinRelated("list.[board.[team]]")
      .select("list:board:team.id")
      .findById(cardId)) as any).id as string
    const participant = await Participant.query()
      .findOne("user_id", userId)
      .andWhere("team_id", teamId)
    if (!participant) {
      throw new Error("User is not in team")
    }
    const user = await this.userService.findById(userId)
    const affectedCard = (
      await Card.query()
        .patch({ assignee_id: userId })
        .where("card.id", cardId)
        .withGraphFetched("list")
        .returning("card.*")
    )[0]
    if (!!affectedCard) {
      await publish({ cardId, user, boardId: affectedCard.list.board_id })
      return true
    }
    return false
  }

  @Authorized([Role.BOARD])
  @Subscription(() => CardUserAssignedPayload, {
    topics: Notification.CARD_USER_ASSIGNED,
    filter: boardIdFilter,
  })
  async cardUserAssigned(
    @Arg("boardId") boardId: string,
    @Root() payload: CardUserAssignedPayload
  ) {
    return payload
  }

  @Authorized()
  @Mutation(() => Boolean)
  async unassignUser(
    @Arg("cardId") cardId: string,
    @Ctx() ctx: Context,
    @PubSub(Notification.CARD_USER_UNASSIGNED) publish: Publisher<CardIdBoardIdPayload>
  ) {
    const card = await this.cardService.card(ctx.userId, cardId)
    if (!card) {
      throw new Error("Card does not exist")
    }
    const affectedCard = (
      await Card.query()
        .patch({ assignee_id: null })
        .where("card.id", cardId)
        .withGraphFetched("list")
        .returning("card.*")
    )[0]
    if (!!affectedCard) {
      await publish({ cardId, boardId: affectedCard.list.board_id })
      return true
    }
    return false
  }

  @Authorized([Role.BOARD])
  @Subscription(() => CardIdBoardIdPayload, {
    topics: Notification.CARD_USER_UNASSIGNED,
    filter: boardIdFilter,
  })
  async cardUserUnassigned(@Arg("boardId") boardId: string, @Root() payload: CardIdBoardIdPayload) {
    return payload
  }
}
