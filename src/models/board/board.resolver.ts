import { Arg, Authorized, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from "type-graphql"
import Board from "./board.model"
import Context from "../../common/types/context"
import { raw } from "objection"
import CreateBoardResponse from "./types/createBoard"
import UserService from "../user/user.service"
import { Inject } from "typescript-ioc"
import BoardService from "./board.service"
import TeamService from "../team/team.service"
import { RenameResponse } from "../../common/types/objectTypes"

@Resolver(Board)
export default class BoardResolver {
  @Inject
  private userService: UserService

  @Inject
  private boardService: BoardService

  @Inject
  private teamService: TeamService

  @Authorized()
  @Query(() => Board)
  async board(@Arg("id") id: string, @Ctx() ctx: Context) {
    return this.boardService.board(ctx.userId, id)
  }

  @Authorized()
  @Mutation(() => CreateBoardResponse)
  async createBoard(
    @Arg("teamId") teamId: string,
    @Arg("name") name: string,
    @Ctx() ctx: Context
  ): Promise<CreateBoardResponse> {
    if (name.length == 0) throw new Error("Name is empty")
    const team = await this.teamService.teams(ctx.userId, true).findOne("team.id", teamId)

    if (!team) return {}

    const existingBoard = await team
      .$relatedQuery("boards")
      .findOne(raw("LOWER(name)"), name.toLowerCase())
    if (!!existingBoard) {
      return { exists: true }
    }

    const newBoard = await team.$relatedQuery("boards").insert({ name })
    return { board: newBoard }
  }

  @Authorized()
  @Mutation(() => RenameResponse)
  async renameBoard(
    @Arg("boardId") boardId: string,
    @Arg("name") name: string,
    @Ctx() ctx: Context
  ): Promise<RenameResponse> {
    if (name.length == 0) throw new Error("Name is empty")
    const board = await this.boardService.ownBoard(ctx.userId, boardId)
    if (!board) throw new Error("Board does not exist")
    const existingBoard = await this.boardService
      .ownBoards(ctx.userId)
      .where("board.team_id", board.team_id)
      .findOne(raw("LOWER(board.name)"), name.toLowerCase())
    if (!!existingBoard) {
      if (existingBoard.id === boardId) return { success: true }
      else return { exists: true }
    }
    const affected = await Board.query().patch({ name }).where("board.id", boardId)
    return { success: affected > 0 }
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deleteBoard(@Arg("id") id: string, @Ctx() ctx: Context) {
    return (await this.boardService.ownBoard(ctx.userId, id).delete()) > 0
  }

  @FieldResolver(() => Boolean)
  async isOwn(@Root() board: Board, @Ctx() ctx: Context) {
    return !!(await this.boardService.ownBoard(ctx.userId, board.id))
  }
}
