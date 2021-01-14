import { BoardIdArgs } from "../../common/types/argTypes"
import BoardService from "./board.service"
import { Container } from "typescript-ioc"
import { FilterFunc } from "../../common/lib/filterFunc"

const boardService = Container.get(BoardService)

export const boardFilter: FilterFunc<string> = async ({ context, payload }) => {
  return !!(await boardService.board(context.userId, payload))
}

export const boardIdFilter: FilterFunc<{ board_id: string } | { boardId: string }, BoardIdArgs> = ({
  payload,
  args,
}) => {
  if (payload.hasOwnProperty("board_id")) {
    // @ts-ignore
    return args.boardId === payload.board_id
  } else if (payload.hasOwnProperty("boardId")) {
    // @ts-ignore
    return args.boardId === payload.boardId
  }
}
