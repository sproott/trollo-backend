import { Arg, Authorized, Ctx, Int, Mutation, Query, Resolver } from "type-graphql"
import Card from "./card.model"
import { Inject } from "typescript-ioc"
import ListService from "../list/list.service"
import Context from "../../common/types/context"
import CardService from "./card.service"
import { raw } from "objection"

@Resolver(Card)
export default class CardResolver {
  @Inject
  private listService: ListService

  @Inject
  private cardService: CardService

  @Authorized()
  @Mutation(() => Card)
  async createCard(@Arg("name") name: string, @Arg("listId") listId: string, @Ctx() ctx: Context) {
    const list = await this.listService.list(ctx.getUserId(), listId)

    if (!!list) {
      return Card.query().insert({
        name,
        index: await this.cardService.nextIndex(ctx.getUserId(), listId),
        list_id: listId
      })
    }

    throw new Error("List doesn't exist")
  }

  @Authorized()
  @Mutation(() => Boolean)
  async moveCard(@Arg("cardId") cardId: string, @Arg("listId", { nullable: true }) listId: string, @Arg("destinationIndex", type => Int) destinationIndex: number, @Ctx() ctx: Context) {
    const card = await this.cardService.card(ctx.getUserId(), cardId).withGraphFetched("list")
    if (!card) throw new Error("Card doesn't exist")

    if (!listId) {
      listId = card.list_id
    } else if (listId !== card.list_id && !(await this.listService.list(ctx.getUserId(), listId).where("list.board_id", card.list.board_id))) {
      return false
    }

    const nextIndex = await this.cardService.nextIndex(ctx.getUserId(), listId)

    if (destinationIndex > nextIndex) destinationIndex = nextIndex
    const sourceIndex = card.index

    if (listId === card.list_id && (sourceIndex === destinationIndex || (nextIndex === destinationIndex && sourceIndex + 1 === nextIndex))) return true

    const cards = this.cardService.cards(ctx.getUserId()).where("list_id", listId)

    if (listId === card.list_id) {
      if (sourceIndex < destinationIndex) {
        await cards.patch({ index: raw("index - 1") }).where("index", ">", sourceIndex).andWhere("index", "<=", destinationIndex)
      } else {
        await cards.patch({ index: raw("index + 1") }).where("index", "<", sourceIndex).andWhere("index", ">=", destinationIndex)
      }
      await Card.query().patch({ index: destinationIndex }).where("id", cardId)
      return true
    } else {
      const sourceCards = this.cardService.cards(ctx.getUserId()).where("list_id", card.list_id)
      await sourceCards.patch({ index: raw("index - 1") }).where("index", ">", sourceIndex).debug()
      await cards.patch({ index: raw("index + 1") }).where("index", ">=", destinationIndex).debug()
      await Card.query().patch({ index: destinationIndex, list_id: listId }).where("id", cardId).debug()
      return true
    }
  }

  @Authorized()
  @Query(() => Int)
  async nextIndex(@Arg("listId") listId: string, @Ctx() ctx: Context) {
    return this.cardService.nextIndex(ctx.getUserId(), listId)
  }
}