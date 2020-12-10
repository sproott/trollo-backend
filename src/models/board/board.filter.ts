import { Container } from "typescript-ioc"
import { FilterFuncInner } from "../../common/lib/filterFunc"
import BoardService from "./board.service"

const boardService = Container.get(BoardService)

const boardFilter: FilterFuncInner<string> = async ({ context, payload }) => {
  return !!(await boardService.board(context.userId, payload))
}

export default boardFilter
