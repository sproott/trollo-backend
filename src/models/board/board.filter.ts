import { Container } from "typescript-ioc"
import { FilterFuncInner } from "../../common/lib/filterFunc"
import BoardService from "./board.service"
import { BoardIdArgs } from "../../common/types/argTypes"

const boardService = Container.get(BoardService)

export const boardFilter: FilterFuncInner<string> = async ({ context, payload }) => {
  return !!(await boardService.board(context.userId, payload))
}

export const boardIdFilter: FilterFuncInner<
  { board_id: string } | { boardId: string },
  BoardIdArgs
> = ({ payload, args }) => {
  if (payload.hasOwnProperty("board_id")) {
    // @ts-ignore
    return args.boardId === payload.board_id
  } else if (payload.hasOwnProperty("boardId")) {
    // @ts-ignore
    return args.boardId === payload.boardId
  }
}
