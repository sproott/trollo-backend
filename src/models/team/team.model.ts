import { Field, ID, ObjectType, UseMiddleware } from "type-graphql"
import { Model, RelationMappings } from "objection"

import { AutoLoader } from "../../common/loader/autoloaderMiddleware"
import Board from "../board/board.model"
import Flair from "../flair/flair.model"
import { MaxLength } from "class-validator"
import { Participant } from "../participant/participant.model"

@ObjectType()
export default class Team extends Model {
  static get tableName() {
    return "team"
  }

  @Field(() => ID)
  id: string

  @Field()
  name: string

  @UseMiddleware(AutoLoader())
  @Field(() => [Board])
  boards: Board[]

  @UseMiddleware(AutoLoader())
  @Field(() => [Participant])
  participants: Participant[]

  @UseMiddleware(AutoLoader())
  @Field(() => [Flair])
  flairs: Flair[]

  static get relationMappings(): RelationMappings {
    return {
      participants: {
        relation: Model.HasManyRelation,
        modelClass: Participant,
        join: {
          from: "team.id",
          to: "participant.team_id",
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
      flairs: {
        relation: Model.HasManyRelation,
        modelClass: Flair,
        join: {
          from: "team.id",
          to: "flair.team_id",
        },
      },
    }
  }
}
