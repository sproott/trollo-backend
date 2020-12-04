import Board from "./board.model"
import { Inject, Singleton } from "typescript-ioc"
import TeamService from "../team/team.service"

@Singleton
export default class BoardService {
  @Inject
  private teamService: TeamService

  ownBoards = (userId: string) => {
    return Board.query().whereIn("team_id", this.teamService.ownTeams(userId).select("team.id"))
  }

  ownBoard = (userId: string, boardId: string) => {
    return this.ownBoards(userId).findById(boardId)
  }

  boards = (userId: string) => {
    return Board.query().whereIn("team_id", this.teamService.teams(userId).select("team.id"))
  }

  board = (userId: string, boardId: string) => {
    return this.boards(userId).findById(boardId)
  }
}
