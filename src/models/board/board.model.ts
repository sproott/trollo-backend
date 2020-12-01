import { Field, ID, ObjectType, UseMiddleware } from "type-graphql"
import { Model, RelationMappings } from "objection"
import { AutoLoader } from "../../common/loader/autoloaderMiddleware"
import List from "../list/list.model"
import { MaxLength } from "class-validator"

@ObjectType()
export default class Board extends Model {
  static get tableName() {
    return "board"
  }

  @Field(() => ID)
  id: string

  @Field()
  @MaxLength(50)
  name: string

  @UseMiddleware(AutoLoader())
  @Field(() => [List])
  lists: List[]

  static get relationMappings(): RelationMappings {
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
