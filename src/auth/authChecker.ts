import Context from "../common/types/context"
import { AuthChecker } from "type-graphql"
import Role from "./types/role"

const customAuthChecker: AuthChecker<Context, Role> = async ({ context }, roles: Role[]) => {
  if (context.isUnauthenticated()) return false

  const user = await context.getUser()

  if (roles.includes(Role.APP_ADMIN)) {
    return user.is_admin
  }

  return true
}

export default customAuthChecker
