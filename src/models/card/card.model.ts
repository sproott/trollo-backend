import { Field, ID, Int, ObjectType, UseMiddleware } from "type-graphql"
import { Model, RelationMappings } from "objection"
import { AutoLoader } from "../../common/loader/autoloaderMiddleware"
import List from "../list/list.model"
import { MaxLength } from "class-validator"
import User from "../user/user.model"

@ObjectType()
export default class Card extends Model {
  static get tableName() {
    return "card"
  }

  @Field(() => ID)
  id: string

  @Field()
  @MaxLength(50)
  name: string

  @Field({ nullable: true })
  @MaxLength(256)
  description: string

  @Field(() => Int)
  index: number

  @UseMiddleware(AutoLoader())
  @Field(() => User, { nullable: true })
  assignee?: User
  assignee_id: string

  @UseMiddleware(AutoLoader())
  @Field(() => List)
  list: List
  list_id: string

  static get relationMappings(): RelationMappings {
    return {
      list: {
        relation: Model.BelongsToOneRelation,
        modelClass: List,
        join: {
          from: "card.list_id",
          to: "list.id",
        },
      },
      assignee: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: "card.assignee_id",
          to: "user.id",
        },
      },
    }
  }
}
