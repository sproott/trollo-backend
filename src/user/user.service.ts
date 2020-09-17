import { Singleton } from "typescript-ioc"
import User from "./user.model"

@Singleton
export class UserService {
  findById(id: number): Promise<User> {
    return User.query().findById(id)
  }

  findByUsername(username: string, caseInsensitive = true) {
    return this.findBy(Column.USERNAME, username, caseInsensitive).then((users) => users[0])
  }

  findByEmail(email: string, caseInsensitive = true) {
    return this.findBy(Column.EMAIL, email, caseInsensitive).then((users) => users[0])
  }

  insertOne(user: User) {
    return User.query().insert(user)
  }

  insertMany(...users: User[]) {
    return User.query().insert(users)
  }

  private findBy(column: Column, value: string, caseInsensitive = true): Promise<User[]> {
    return caseInsensitive
      ? this.findByCaseInsensitive(column, value)
      : User.query().where(column, "=", value)
  }

  private findByCaseInsensitive(column: Column, value: string): Promise<User[]> {
    return User.query().whereRaw("LOWER(" + column + ") = ?", value.toLowerCase())
  }
}

enum Column {
  USERNAME = "username",
  EMAIL = "email",
}
