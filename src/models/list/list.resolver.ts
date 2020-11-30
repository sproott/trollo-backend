import { Arg, Authorized, Ctx, Mutation, Resolver } from "type-graphql"
import List from "./list.model"
import { Inject } from "typescript-ioc"
import Context from "../../common/types/context"
import BoardService from "../board/board.service"
import CreateListResponse from "./types/createList"
import { raw } from "objection"

@Resolver(List)
export default class ListResolver {
  @Inject
  private boardService: BoardService

  @Authorized()
  @Mutation(() => CreateListResponse)
  async createList(
    @Arg("name") name: string,
    @Arg("boardId") boardId: string,
    @Ctx() ctx: Context
  ) {
    const board = await this.boardService.board(ctx.getUserId(), boardId)

    if (!board) {
      throw new Error("Board doesn't exist")
    }

    const existingList = await board
      .$relatedQuery("lists")
      .findOne(raw("LOWER(name)"), name.toLowerCase())
    if (!!existingList) {
      return { exists: true }
    }

    const newList = await List.query().insert({ name, board_id: boardId })
    return { list: newList }
  }
}
