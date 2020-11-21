import { Field, ID, Int, ObjectType, UseMiddleware } from "type-graphql"
import { Model, RelationMappings } from "objection"
import { AutoLoader } from "../../common/loader/autoloaderMiddleware"
import List from "../list/list.model"

@ObjectType()
export default class Card extends Model {
  static get tableName() {
    return "card"
  }

  @Field(() => ID)
  id: string

  @Field()
  name: string

  @Field(type => Int)
  index: number

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
          to: "list.id"
        }
      }
    }
  }
}
