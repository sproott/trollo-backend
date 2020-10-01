import { Authorized, Field, ID, ObjectType, UseMiddleware } from "type-graphql"
import { Model } from "objection"
import Role from "../../auth/types/role"
import User from "../user/user.model"
import { AutoLoader } from "../../common/loader/autoloaderMiddleware"

@ObjectType()
export default class Card extends Model {
  static get tableName() {
    return "card"
  }

  @Authorized(Role.APP_ADMIN)
  @Field(() => ID)
  id: string

  @Field()
  name: string
}
