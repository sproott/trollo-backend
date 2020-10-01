import { Authorized, Field, ID, ObjectType, UseMiddleware } from "type-graphql"
import { Model } from "objection"
import Role from "../../auth/types/role"
import User from "../user/user.model"
import { AutoLoader } from "../../common/loader/autoloaderMiddleware"
import List from "../list/list.model"

@ObjectType()
export default class Board extends Model {
  static get tableName() {
    return "board"
  }

  @Authorized(Role.APP_ADMIN)
  @Field(() => ID)
  id: string

  @Field()
  name: string

  @UseMiddleware(AutoLoader)
  @Field(() => [List], { nullable: true })
  lists?: List[]

  static get relationMappings() {
    return {
      lists: {
        relation: Model.HasManyRelation,
        modelClass: List,
        join: {
          from: "board.id",
          to: "list.board_id",
        },
      },
    }
  }
}
