import { Arg, Authorized, Ctx, Int, Mutation, Query, Resolver } from "type-graphql"
import Card from "./card.model"
import { Inject } from "typescript-ioc"
import ListService from "../list/list.service"
import Context from "../../common/types/context"
import CardService from "./card.service"
import { raw } from "objection"
import List from "../list/list.model"
import CreateCardResponse from "./types/createCard"
import { RenameResponse } from "../../common/types/objectTypes"

@Resolver(Card)
export default class CardResolver {
  @Inject
  private listService: ListService

  @Inject
  private cardService: CardService

  @Authorized()
  @Mutation(() => CreateCardResponse)
  async createCard(
    @Arg("name") name: string,
    @Arg("description", { nullable: true }) description: string,
    @Arg("listId") listId: string,
    @Ctx() ctx: Context
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
    return { card: newCard }
  }

  @Authorized()
  @Mutation(() => Boolean)
  async moveCard(
    @Arg("cardId") cardId: string,
    @Arg("listId", { nullable: true }) listId: string,
    @Arg("destinationIndex", () => Int) destinationIndex: number,
    @Ctx() ctx: Context
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
      return true
    } else {
      const sourceCards = this.cardService.cards(ctx.userId).where("list_id", card.list_id)
      await sourceCards.patch({ index: raw("index - 1") }).where("index", ">", sourceIndex)
      await cards.patch({ index: raw("index + 1") }).where("index", ">=", destinationIndex)
      await Card.query().patch({ index: destinationIndex, list_id: listId }).where("id", cardId)
      return true
    }
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
    @Ctx() ctx: Context
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
    const affected = await Card.query().patch({ name }).where("card.id", cardId)
    return { success: affected > 0 }
  }

  @Authorized()
  @Mutation(() => Boolean)
  async updateCardDescription(
    @Arg("cardId") cardId: string,
    @Arg("description") description: string,
    @Ctx() ctx: Context
  ) {
    if (description.length == 0) throw new Error("Description is empty")
    return (
      (await Card.query()
        .patch({ description })
        .where("card.id", this.cardService.card(ctx.userId, cardId).select("card.id"))) > 0
    )
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deleteCard(@Arg("id") id: string, @Ctx() ctx: Context) {
    const card = await this.cardService.card(ctx.userId, id)
    if (!card) return false
    await this.cardService.card(ctx.userId, id).delete()
    await this.cardService
      .cards(ctx.userId)
      .where("list_id", card.list_id)
      .andWhere("index", ">", card.index)
      .patch({ index: raw("index - 1") })
    return true
  }
}
