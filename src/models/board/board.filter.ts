import { BoardIdArgs } from "../../common/types/argTypes"
import BoardService from "./board.service"
import { Container } from "typescript-ioc"
import { FilterFunc } from "../../common/lib/filterFunc"

const boardService = Container.get(BoardService)

export const boardFilter: FilterFunc<string> = async ({ context, payload }) => {
  return !!(await boardService.board(context.userId, payload))
}

export const boardIdFilter: FilterFunc<string, BoardIdArgs> = ({ payload: boardId, args }) => {
  return args.boardId === boardId
}
