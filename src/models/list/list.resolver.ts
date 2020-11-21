import { Authorized, Ctx, Mutation, Resolver } from "type-graphql"
import List from "./list.model"
import { Inject } from "typescript-ioc"
import Context from "../../common/types/context"
import BoardService from "../board/board.service"

@Resolver(List)
export default class ListResolver {
  @Inject
  private boardService: BoardService

  @Authorized()
  @Mutation(() => List)
  async createList(name: string, boardId: string, @Ctx() ctx: Context) {
    const team = await this.boardService.board(ctx.getUserId(), boardId)

    if (!!team) {
      return List.query().insert({ name, board_id: boardId })
    }

    throw new Error("Board doesn't exist")
  }
}