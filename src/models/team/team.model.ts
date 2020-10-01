import { Authorized, Field, ID, ObjectType } from "type-graphql"
import { Model } from "objection"
import Role from "../../auth/types/role"

@ObjectType()
export default class Team extends Model {
  static get tableName() {
    return "team"
  }

  @Authorized(Role.APP_ADMIN)
  @Field(() => ID)
  id: string

  @Field()
  name: string
}
