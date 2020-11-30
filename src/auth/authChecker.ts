import Context from "../common/types/context"
import { AuthChecker } from "type-graphql"
import Role from "./types/role"
import User from "../models/user/user.model";

const customAuthChecker: AuthChecker<Context, Role> = async ({ context, root }, roles: Role[]) => {
  if (context.isUnauthenticated()) return false

  const user = await context.getUser()

  if (roles.includes(Role.APP_ADMIN) && !user.is_admin) {
    return false
  }

  if (roles.includes(Role.OWNER)) {
    if (!(root instanceof User)) {
      throw new Error("Auth error - root of owner is not User")
    }
    if (root.id !== context.getUserId()) {
      return false
    }
  }

  return true
}

export default customAuthChecker
