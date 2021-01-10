import { Field, ID, ObjectType, UseMiddleware } from "type-graphql"
import { Model, RelationMappings } from "objection"

import { AutoLoader } from "../../common/loader/autoloaderMiddleware"
import Card from "../card/card.model"
import { Max } from "class-validator"
import Team from "../team/team.model"

@ObjectType()
export default class Flair extends Model {
  static get tableName() {
    return "flair"
  }

  @Field(() => ID)
  id: string

  @Field()
  name: string

  @Field(() => Number)
  @Max(360)
  hue: number

  @UseMiddleware(AutoLoader())
  @Field(() => Team)
  team: Team
  team_id: string

  @UseMiddleware(AutoLoader())
  @Field(() => [Card])
  cards: [Card]

  static get relationMappings(): RelationMappings {
    return {
      team: {
        relation: Model.BelongsToOneRelation,
        modelClass: Team,
        join: {
          from: "flair.team_id",
          to: "team.id",
        },
      },
      cards: {
        relation: Model.ManyToManyRelation,
        modelClass: Card,
        join: {
          from: "flair.id",
          through: {
            from: "cards_flairs.flair_id",
            to: "cards_flairs.card_id",
          },
          to: "card.id",
        },
      },
    }
  }
}
