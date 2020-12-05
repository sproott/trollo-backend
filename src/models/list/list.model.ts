import { Field, ID, Int, ObjectType, UseMiddleware } from "type-graphql"
import { Model, RelationMappings } from "objection"
import { AutoLoader } from "../../common/loader/autoloaderMiddleware"
import Card from "../card/card.model"
import Board from "../board/board.model"
import { MaxLength } from "class-validator"

@ObjectType()
export default class List extends Model {
  static get tableName() {
    return "list"
  }

  @Field(() => ID)
  id: string

  @Field()
  @MaxLength(50)
  name: string

  @Field(() => Int)
  index: number

  @UseMiddleware(AutoLoader({ customCondition: (qb) => qb.orderBy("index") }))
  @Field(() => [Card])
  cards: Card[]

  @UseMiddleware(AutoLoader())
  @Field(() => Board)
  board: Board
  board_id: string

  static get relationMappings(): RelationMappings {
    return {
      cards: {
        relation: Model.HasManyRelation,
        modelClass: Card,
        join: {
          from: "list.id",
          to: "card.list_id",
        },
      },
      board: {
        relation: Model.BelongsToOneRelation,
        modelClass: Board,
        join: {
          from: "list.board_id",
          to: "board.id",
        },
      },
    }
  }
}
