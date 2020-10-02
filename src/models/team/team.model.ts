import { Field, ID, ObjectType, UseMiddleware } from "type-graphql"
import { Model } from "objection"
import User from "../user/user.model"
import { AutoLoader } from "../../common/loader/autoloaderMiddleware"
import Board from "../board/board.model"

@ObjectType()
export default class Team extends Model {
  static get tableName() {
    return "team"
  }

  @Field(() => ID)
  id: string

  @Field()
  name: string

  @UseMiddleware(AutoLoader)
  @Field(() => User)
  admin: User
  admin_id: string

  @UseMiddleware(AutoLoader)
  @Field(() => [Board], { nullable: true })
  boards?: Board[]

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
      boards: {
        relation: Model.HasManyRelation,
        modelClass: Board,
        join: {
          from: "team.id",
          to: "board.team_id",
        },
      },
    }
  }
}
