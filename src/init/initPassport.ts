import { GraphQLLocalStrategy } from "graphql-passport"
import User from "../user/user.model"
import { Crypt } from "../common/crypt"
import { Container } from "typescript-ioc"
import { UserService } from "../user/user.service"
import passport from "passport"

export default function initPassport() {
  const userService = Container.get(UserService)

  // make auth strategy
  passport.use(
    new GraphQLLocalStrategy(
      async (username: string, password: string, done) => {
        const user: User = await userService.findByUsername(username)
        if (!user) {
          throw new Error("Username doesn't exist")
        }
        return Crypt.compare(password, user.password).then((success) => {
          if (success) {
            done(null, user)
          } else {
            done(new Error("Incorrect password"), null)
          }
        })
      }
    )
  )

  // add user (de)serialization
  passport.serializeUser((user: User, done) => {
    done(null, user.id)
  })

  passport.deserializeUser(async (id: number, done) => {
    const user: User = await userService.findById(id)
    done(null, user)
  })
}
