import Board from "./board.model"
import User from "../user/user.model"
import { Singleton } from "typescript-ioc"

@Singleton
export class BoardService {
  getOwnBoardById(boardId: string, userId: string) {
    return Board.query()
      .findById(boardId)
      .whereIn(
        "id",
        User.query()
          .findById(userId)
          .select("participants:team:boards.id")
          .joinRelated("participants.[team.[boards]]")
          .where("participants.owner", true)
      )
  }
}
