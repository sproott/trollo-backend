import { Authorized, Field, ID, ObjectType } from "type-graphql"
import { Model } from "objection"
import Role from "../auth/types/role"

@ObjectType()
export default class User extends Model {
  static get tableName() {
    return "user"
  }

  @Authorized(Role.APP_ADMIN)
  @Field(() => ID)
  id: string

  @Field()
  username: string

  @Field()
  email: string

  password: string

  @Field()
  isAdmin: boolean
}
