import Context from "../common/types/context"
import { AuthChecker } from "type-graphql"
import Role from "./types/role"

const customAuthChecker: AuthChecker<Context, Role> = async ({ context }, roles: Role[]) => {
  const user = await context.getUser()

  if (!user) return false

  if (roles.includes(Role.APP_ADMIN)) {
    return user.isAdmin
  }

  return true
}

export default customAuthChecker
