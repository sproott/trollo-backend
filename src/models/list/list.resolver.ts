import {
  Arg,
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
import List from "./list.model"
import { Inject } from "typescript-ioc"
import Context from "../../common/types/context"
import BoardService from "../board/board.service"
import CreateListResponse from "./types/createList"
import { raw } from "objection"
import ListService from "./list.service"
import { RenameResponse } from "../../common/types/objectTypes"
import Notification from "../../common/types/notification"
import { ListDeletedPayload, ListMovedPayload } from "./types/subscriptionPayloads"
import Role from "../../auth/types/role"
import { boardIdFilter } from "../board/board.filter"
import { and, transform } from "../../common/lib/filterFunc"

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
    @Arg("boardId", () => ID) boardId: string,
    @Ctx() ctx: Context,
    @PubSub(Notification.LIST_CREATED) publish: Publisher<List>
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
    await publish(newList)
    return { list: newList }
  }

  @Authorized([Role.BOARD])
  @Subscription(() => List, {
    topics: Notification.LIST_CREATED,
    filter: transform((p: List) => p.board_id, boardIdFilter),
  })
  async listCreated(@Arg("boardId", () => ID) boardId: string, @Root() payload: List) {
    return payload
  }

  @Authorized()
  @Mutation(() => Boolean)
  async moveList(
    @Arg("listId", () => ID) listId: string,
    @Arg("destinationIndex", () => Int) destinationIndex: number,
    @Ctx() ctx: Context,
    @PubSub(Notification.LIST_MOVED) publish: Publisher<ListMovedPayload>
  ) {
    const list = await this.listService.list(ctx.userId, listId)
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
    const affectedList = (
      await List.query().patch({ index: destinationIndex }).where("id", listId).returning("list.*")
    )[0]
    await publish({ list: affectedList, sourceIndex, destinationIndex, userId: ctx.userId })
    return true
  }

  @Authorized([Role.BOARD])
  @Subscription(() => ListMovedPayload, {
    topics: Notification.LIST_MOVED,
    filter: and<ListMovedPayload>(
      transform((payload) => payload.list.board_id, boardIdFilter),
      ({ context, payload }) => {
        return context.userId !== payload.userId
      }
    ),
  })
  async listMoved(@Arg("boardId", () => ID) boardId: string, @Root() payload: ListMovedPayload) {
    return payload
  }

  @Authorized()
  @Mutation(() => RenameResponse)
  async renameList(
    @Arg("listId", () => ID) listId: string,
    @Arg("name") name: string,
    @Ctx() ctx: Context,
    @PubSub(Notification.LIST_RENAMED) publish: Publisher<List>
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
    const affectedList = (
      await List.query().patch({ name }).where("list.id", listId).returning("list.*")
    )[0]
    if (affectedList) {
      await publish(affectedList)
      return { success: true }
    }
    return { success: false }
  }

  @Authorized([Role.BOARD])
  @Subscription(() => List, {
    topics: Notification.LIST_RENAMED,
    filter: transform((p: List) => p.board_id, boardIdFilter),
  })
  async listRenamed(@Arg("boardId", () => ID) boardId: string, @Root() payload: List) {
    return payload
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deleteList(
    @Arg("id", () => ID) id: string,
    @Ctx() ctx: Context,
    @PubSub(Notification.LIST_DELETED) publish: Publisher<ListDeletedPayload>
  ) {
    const list = await this.listService.list(ctx.userId, id)
    if (!list) return false
    await this.listService.list(ctx.userId, id).delete()
    await this.listService
      .lists(ctx.userId)
      .where("board_id", list.board_id)
      .andWhere("index", ">", list.index)
      .patch({ index: raw("index - 1") })
    await publish({ boardId: list.board_id, listId: id })
    return true
  }

  @Authorized([Role.BOARD])
  @Subscription(() => String, {
    topics: Notification.LIST_DELETED,
    filter: transform((payload: ListDeletedPayload) => {
      return payload.boardId
    }, boardIdFilter),
  })
  async listDeleted(
    @Arg("boardId", () => ID) boardId: string,
    @Root() payload: ListDeletedPayload
  ) {
    return payload.listId
  }
}
