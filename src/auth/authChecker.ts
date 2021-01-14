import { AuthChecker } from "type-graphql"
import BoardService from "../models/board/board.service"
import { Container } from "typescript-ioc"
import Context from "../common/types/context"
import Role from "./types/role"
import TeamService from "../models/team/team.service"
import User from "../models/user/user.model"

const boardService = Container.get(BoardService)
const teamService = Container.get(TeamService)

const customAuthChecker: AuthChecker<Context, Role> = async (
  { context, root, args },
  roles: Role[]
) => {
  if (context.isUnauthenticated()) return false
  const user = await context.getUser()
  if (user.is_admin) return true
  if (roles.includes(Role.APP_ADMIN)) {
    return false
  }
  if (roles.includes(Role.OWNER)) {
    if (!(root instanceof User)) {
      throw new Error("Auth error - root of owner is not User")
    }
    if (root.id !== context.userId) {
      return false
    }
  }
  if (roles.includes(Role.BOARD) && args["boardId"]) {
    if (!(await boardService.board(context.userId, args["boardId"]))) return false
  }
  if (roles.includes(Role.TEAM) && args["teamId"]) {
    if (!(await teamService.team(context.userId, args["teamId"]))) return false
  }
  return true
}

export default customAuthChecker
