import { raw } from "objection"
import { Singleton } from "typescript-ioc"
import User from "./user.model"

@Singleton
export class UserService {
  findById(id: string): Promise<User> {
    return User.query().findById(id)
  }

  findByUsername(username: string, caseInsensitive = true) {
    return this.findOne(Column.USERNAME, username, caseInsensitive)
  }

  findByEmail(email: string, caseInsensitive = true) {
    return this.findOne(Column.EMAIL, email, caseInsensitive)
  }

  insertOne(user: User) {
    return User.query().insert(user)
  }

  insertMany(...users: User[]) {
    return User.query().insert(users)
  }

  private findOne(column: Column, value: string, caseInsensitive = true) {
    return caseInsensitive
      ? this.findOneCaseInsensitive(column, value)
      : User.query().findOne(column, value)
  }

  private findOneCaseInsensitive(column: Column, value: string) {
    return User.query().findOne(raw("LOWER(" + column + ")"), value.toLowerCase())
  }
}

enum Column {
  USERNAME = "username",
  EMAIL = "email",
}
