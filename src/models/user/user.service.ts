import { raw } from "objection"
import { Singleton } from "typescript-ioc"
import User from "./user.model"

@Singleton
export class UserService {
  findById(id: string): Promise<User> {
    return User.query().findById(id)
  }

  findByUsername(username: string, caseInsensitive = true) {
    return this.findBy(Column.USERNAME, username, caseInsensitive)
  }

  findByEmail(email: string, caseInsensitive = true) {
    return this.findBy(Column.EMAIL, email, caseInsensitive)
  }

  insertOne(user: User) {
    return User.query().insert(user)
  }

  insertMany(...users: User[]) {
    return User.query().insert(users)
  }

  private findBy(column: Column, value: string, caseInsensitive = true) {
    return caseInsensitive
      ? this.findByCaseInsensitive(column, value)
      : User.query().where(column, "=", value)
  }

  private findByCaseInsensitive(column: Column, value: string) {
    return User.query().where(raw("LOWER(" + column + ")"), value.toLowerCase())
  }
}

enum Column {
  USERNAME = "username",
  EMAIL = "email",
}
