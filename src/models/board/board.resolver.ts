import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from "type-graphql"
import Board from "./board.model"
import Context from "../../common/types/context"
import { raw } from "objection"
import CreateBoardResponse from "./types/createBoard"
import { UserService } from "../user/user.service"
import { Inject } from "typescript-ioc"
import { BoardService } from "./board.service"
import Team from "../team/team.model"
import { TeamService } from "../team/team.service"

@Resolver(Board)
export default class BoardResolver {
  @Inject
  userService: UserService

  @Inject
  boardService: BoardService

  @Inject
  teamService: TeamService

  @Authorized()
  @Query(() => Board)
  async board(@Arg("id") id: string, @Ctx() ctx: Context) {
    return this.boardService.getOwnBoardById(id, ctx.getUserId())
  }

  @Authorized()
  @Mutation(() => CreateBoardResponse)
  async createBoard(
    @Arg("teamId") teamId: string,
    @Arg("name") name: string,
    @Ctx() ctx: Context
  ): Promise<CreateBoardResponse> {
    const team = await this.teamService.teams(ctx.getUserId(), true).findOne("team.id", teamId)

    if (!team) return {}

    const existingBoard = await team
      .$relatedQuery("boards")
      .findOne(raw("LOWER(name)"), name.toLowerCase())
    if (!!existingBoard) {
      return { exists: true }
    }

    const newBoard = { name } as Board
    await team.$relatedQuery("boards").insert(newBoard)
    return { board: newBoard }
  }

  @Authorized()
  @Mutation(() => Boolean, { nullable: true })
  async deleteBoard(@Arg("id") id: string, @Ctx() ctx: Context) {
    return (await this.boardService.getOwnBoardById(id, ctx.getUserId()).delete()) > 0
  }
}