import { Arg, Authorized, Ctx, Int, Mutation, Resolver } from "type-graphql"
import List from "./list.model"
import { Inject } from "typescript-ioc"
import Context from "../../common/types/context"
import BoardService from "../board/board.service"
import CreateListResponse from "./types/createList"
import { raw } from "objection"
import ListService from "./list.service"
import { RenameResponse } from "../../common/types/objectTypes"

@Resolver(List)
export default class ListResolver {
  @Inject
  private boardService: BoardService
  @Inject
  private listService: ListService

  @Authorized()
  @Mutation(() => CreateListResponse)
  async createList(
    @Arg("name") name: string,
    @Arg("boardId") boardId: string,
    @Ctx() ctx: Context
  ): Promise<CreateListResponse> {
    if (name.length == 0) throw new Error("Name is empty")
    const board = await this.boardService.board(ctx.userId, boardId)

    if (!board) {
      throw new Error("Board doesn't exist")
    }

    const existingList = await board
      .$relatedQuery("lists")
      .findOne(raw("LOWER(name)"), name.toLowerCase())
    if (!!existingList) {
      return { exists: true }
    }

    const newList = await List.query().insert({
      name,
      board_id: boardId,
      index: await this.listService.nextIndex(ctx.userId, boardId),
    })
    return { list: newList }
  }

  @Authorized()
  @Mutation(() => Boolean)
  async moveList(
    @Arg("listId") cardId: string,
    @Arg("destinationIndex", () => Int) destinationIndex: number,
    @Ctx() ctx: Context
  ) {
    const list = await this.listService.list(ctx.userId, cardId)
    if (!list) throw new Error("List doesn't exist")

    const nextIndex = await this.listService.nextIndex(ctx.userId, list.board_id)

    if (destinationIndex > nextIndex) destinationIndex = nextIndex
    const sourceIndex = list.index

    if (
      sourceIndex === destinationIndex ||
      (nextIndex === destinationIndex && sourceIndex + 1 === nextIndex)
    )
      return true

    const lists = this.listService.lists(ctx.userId).where("board_id", list.board_id)

    if (sourceIndex < destinationIndex) {
      await lists
        .patch({ index: raw("index - 1") })
        .where("index", ">", sourceIndex)
        .andWhere("index", "<=", destinationIndex)
    } else {
      await lists
        .patch({ index: raw("index + 1") })
        .where("index", "<", sourceIndex)
        .andWhere("index", ">=", destinationIndex)
    }
    await List.query().patch({ index: destinationIndex }).where("id", cardId)
    return true
  }

  @Authorized()
  @Mutation(() => RenameResponse)
  async renameList(
    @Arg("listId") listId: string,
    @Arg("name") name: string,
    @Ctx() ctx: Context
  ): Promise<RenameResponse> {
    if (name.length == 0) throw new Error("Name is empty")
    const list = await this.listService.list(ctx.userId, listId)
    if (!list) throw new Error("List does not exist")
    const existingList = await this.listService
      .lists(ctx.userId)
      .where("list.board_id", list.board_id)
      .findOne(raw("LOWER(list.name)"), name.toLowerCase())
    if (!!existingList) {
      if (existingList.id === listId) return { success: true }
      else return { exists: true }
    }
    const affected = await List.query().patch({ name }).where("list.id", listId)
    return { success: affected > 0 }
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deleteList(@Arg("id") id: string, @Ctx() ctx: Context) {
    const list = await this.listService.list(ctx.userId, id)
    if (!list) return false
    await this.listService.list(ctx.userId, id).delete()
    await this.listService
      .lists(ctx.userId)
      .where("board_id", list.board_id)
      .andWhere("index", ">", list.index)
      .patch({ index: raw("index - 1") })
    return true
  }
}
