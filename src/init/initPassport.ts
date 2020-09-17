import User from "../user/user.model"
import { Container } from "typescript-ioc"
import { UserService } from "../user/user.service"
import passport from "passport"
import GraphqlCredentialsStrategy from "./graphqlAuthStrategy"

export default function initPassport() {
  const userService = Container.get(UserService)

  // make auth strategy
  passport.use(new GraphqlCredentialsStrategy())

  // add user (de)serialization
  passport.serializeUser((user: User, done) => {
    done(null, user.id)
  })

  passport.deserializeUser(async (id: number, done) => {
    const user: User = await userService.findById(id)
    done(null, user)
  })
}
