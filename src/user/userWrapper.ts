import User from "./user.model"
import { Inject } from "typescript-ioc"
import { UserService } from "./user.service"

export default class UserWrapper {
  @Inject
  userService: UserService

  id: number

  user: User

  constructor(id: number) {
    this.id = id
  }

  async getUser() {
    if (!this.user) {
      this.user = await this.userService.findById(this.id)
    }
    return this.user
  }
}
