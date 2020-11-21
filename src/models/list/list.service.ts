import { Inject, Singleton } from "typescript-ioc"
import List from "./list.model"
import BoardService from "../board/board.service"

@Singleton
export default class ListService {
  @Inject
  private boardService: BoardService

  lists = (userId: string) => {
    return List.query().whereIn("board_id", this.boardService.boards(userId).select("board.id"))
  }

  list = (userId: string, listId: string) => {
    return this.lists(userId).findById(listId)
  }
}