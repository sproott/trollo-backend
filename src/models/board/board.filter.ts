import { Container } from "typescript-ioc"
import { FilterFuncInner } from "../../common/lib/filterFunc"
import BoardService from "./board.service"
import { BoardIdArgs } from "../../common/types/argTypes"

const boardService = Container.get(BoardService)

export const boardFilter: FilterFuncInner<string> = async ({ context, payload }) => {
  return !!(await boardService.board(context.userId, payload))
}

export const boardIdFilter: FilterFuncInner<{ board_id: string }, BoardIdArgs> = ({
  payload,
  args,
}) => {
  return args.boardId === payload.board_id
}
