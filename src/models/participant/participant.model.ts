import { Model, RelationMappings } from "objection"
import Team from "../team/team.model"
import User from "../user/user.model"
import { Field, ObjectType, UseMiddleware } from "type-graphql"
import { AutoLoader } from "../../common/loader/autoloaderMiddleware"

@ObjectType()
export class Participant extends Model {
  static get tableName() {
    return "participant"
  }

  static get idColumn() {
    return ["user_id", "team_id"]
  }

  @UseMiddleware(AutoLoader())
  @Field(() => User)
  user: User
  user_id: string

  @UseMiddleware(AutoLoader())
  @Field(() => Team)
  team: Team
  team_id: string

  owner: boolean

  static get relationMappings(): RelationMappings {
    return {
      user: {
        modelClass: User,
        relation: Model.BelongsToOneRelation,
        join: {
          from: "participant.user_id",
          to: "user.id",
        },
      },
      team: {
        modelClass: Team,
        relation: Model.BelongsToOneRelation,
        join: {
          from: "participant.team_id",
          to: "team.id",
        },
      },
    }
  }
}
