import User from "./user.model"
import { Inject } from "typescript-ioc"
import UserService from "./user.service"

export default class UserWrapper {
  @Inject
  private userService: UserService

  id: string

  user: User

  constructor(id: string) {
    this.id = id
  }

  getUser = async () => {
    if (!this.user) {
      this.user = await this.userService.findById(this.id)
    }
    return this.user
  }
}
