import { Authorized, Field, ID, ObjectType, UseMiddleware } from "type-graphql"
import { Model } from "objection"
import Role from "../../auth/types/role"
import User from "../user/user.model"
import { AutoLoader } from "../../common/loader/autoloaderMiddleware"

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

  @UseMiddleware(AutoLoader)
  @Field(() => User)
  admin: User
  admin_id: string

  static get relationMappings() {
    return {
      admin: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: "team.admin_id",
          to: "user.id",
        },
      },
    }
  }
}
