import Board from "./board.model"
import { Inject, Singleton } from "typescript-ioc"
import TeamService from "../team/team.service"

@Singleton
export default class BoardService {
  @Inject
  private teamService: TeamService

  getOwnBoardById = (boardId: string, userId: string) => {
    return Board.query()
      .findById(boardId)
      .whereIn(
        "team_id",
        this.teamService.ownTeams(userId).select("team.id")
      )
  }

  boards = (userId: string) => {
    return Board.query().whereIn("team_id", this.teamService.teams(userId).select("team.id"))
  }

  board = (userId: string, boardId: string) => {
    return this.boards(userId).findById(boardId)
  }
}
