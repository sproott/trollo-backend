import { Field, ID, ObjectType, UseMiddleware } from "type-graphql"
import { Model, RelationMappings } from "objection"

import { AutoLoader } from "../../common/loader/autoloaderMiddleware"
import List from "../list/list.model"
import { MaxLength } from "class-validator"
import Team from "../team/team.model"

@ObjectType()
export default class Board extends Model {
  static get tableName() {
    return "board"
  }

  @Field(() => ID)
  id: string

  @Field()
  name: string

  @UseMiddleware(AutoLoader({ customCondition: (qb) => qb.orderBy("index") }))
  @Field(() => [List])
  lists: List[]

  @UseMiddleware(AutoLoader())
  @Field(() => Team)
  team: Team
  team_id: string

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
      team: {
        relation: Model.BelongsToOneRelation,
        modelClass: Team,
        join: {
          from: "board.team_id",
          to: "team.id",
        },
      },
    }
  }
}
