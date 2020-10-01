import User from "../models/user/user.model"
import { Container } from "typescript-ioc"
import { UserService } from "../models/user/user.service"
import passport from "passport"
import GraphqlCredentialsStrategy from "../auth/graphqlCredentialsStrategy"
import UserWrapper from "../models/user/userWrapper"

export default function initPassport() {
  const userService = Container.get(UserService)

  // make auth strategy
  passport.use(new GraphqlCredentialsStrategy())

  // add user (de)serialization
  passport.serializeUser((user: User, done) => {
    done(null, user.id)
  })

  passport.deserializeUser((id: string, done) => {
    const userWrapper = new UserWrapper(id)
    done(null, userWrapper)
  })
}
