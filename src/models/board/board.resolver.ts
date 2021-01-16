import {
  Arg,
  Authorized,
  Ctx,
  FieldResolver,
  ID,
  Mutation,
  Publisher,
  PubSub,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql"
import Board from "./board.model"
import Context from "../../common/types/context"
import { raw } from "objection"
import CreateBoardResponse from "./types/createBoard"
import UserService from "../user/user.service"
import { Inject } from "typescript-ioc"
import BoardService from "./board.service"
import TeamService from "../team/team.service"
import { RenameResponse } from "../../common/types/objectTypes"
import Notification from "../../common/types/notification"
import { and, FilterFuncData, transform } from "../../common/lib/filterFunc"
import { boardFilter } from "./board.filter"
import { BoardCreatedPayload, BoardDeletedPayload } from "./types/subscriptionPayloads"
import { teamParticipantFilter } from "../team/team.filter"
import { Participant } from "../participant/participant.model"
import { BoardIdArgs } from "../../common/types/argTypes"

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
    @Arg("teamId", () => ID) teamId: string,
    @Arg("name") name: string,
    @Ctx() ctx: Context,
    @PubSub(Notification.BOARD_CREATED) publish: Publisher<BoardCreatedPayload>
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
    await publish({ board: newBoard, teamId })
    return { board: newBoard }
  }

  @Authorized()
  @Subscription(() => BoardCreatedPayload, {
    topics: Notification.BOARD_CREATED,
    filter: transform((payload: BoardCreatedPayload) => payload.teamId, teamParticipantFilter),
  })
  async boardCreated(@Root() payload: BoardCreatedPayload) {
    return payload
  }

  @Authorized()
  @Mutation(() => RenameResponse)
  async renameBoard(
    @Arg("boardId", () => ID) boardId: string,
    @Arg("name") name: string,
    @Ctx() ctx: Context,
    @PubSub(Notification.BOARD_RENAMED) publish: Publisher<Board>
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
    const affectedBoard = (
      await Board.query().patch({ name }).where("board.id", boardId).returning("board.*")
    )[0]
    if (!!affectedBoard) {
      await publish(affectedBoard)
      return { success: true }
    }
    return { success: false }
  }

  @Authorized()
  @Subscription(() => Board, {
    topics: Notification.BOARD_RENAMED,
    filter: and<Board, BoardIdArgs>(
      transform((board) => board.id, boardFilter),
      ({ payload, args }) => {
        return !!args.boardId ? args.boardId === payload.id : true
      }
    ),
  })
  async boardRenamed(@Arg("boardId", { nullable: true }) boardId: string, @Root() payload: Board) {
    return payload
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deleteBoard(
    @Arg("id", () => ID) id: string,
    @Ctx() ctx: Context,
    @PubSub(Notification.BOARD_DELETED) publish: Publisher<BoardDeletedPayload>
  ) {
    const board = await this.boardService.ownBoard(ctx.userId, id)
    if (!board) throw new Error("Board does not exist")
    const participantIds = (
      await Participant.query().where("team_id", board.team_id).select("user_id")
    ).map((p) => p.user_id)
    await Board.query().deleteById(id)
    await publish({ boardId: id, participantIds })
    return true
  }

  @Authorized()
  @Subscription(() => String, {
    topics: Notification.BOARD_DELETED,
    filter: ({ context, payload, args }: FilterFuncData<BoardDeletedPayload, BoardIdArgs>) =>
      !!payload.participantIds.find((id) => id === context.userId) &&
      (!!args.boardId ? args.boardId === payload.boardId : true),
  })
  async boardDeleted(
    @Arg("boardId", () => ID, { nullable: true }) boardId: string,
    @Root() payload: BoardDeletedPayload
  ) {
    return payload.boardId
  }

  @FieldResolver(() => Boolean)
  async isOwn(@Root() board: Board, @Ctx() ctx: Context) {
    return !!(await this.boardService.ownBoard(ctx.userId, board.id))
  }
}
