import { Authorized, Field, ID, ObjectType, UseMiddleware } from "type-graphql"
import { Model } from "objection"
import Role from "../../auth/types/role"
import Team from "../team/team.model"
import { AutoLoader } from "../../common/loader/autoloaderMiddleware"

@ObjectType()
export default class User extends Model {
  static get tableName() {
    return "user"
  }

  @Authorized(Role.APP_ADMIN)
  @Field(() => ID)
  id: string

  @Field()
  username: string

  @Field()
  email: string

  password: string

  @UseMiddleware(AutoLoader)
  @Field(() => [Team])
  teams: Team[]

  @Field()
  isAdmin: boolean

  static get relationMappings() {
    return {
      teams: {
        relation: Model.ManyToManyRelation,
        modelClass: Team,
        join: {
          from: "user.id",
          through: {
            from: "users_teams.user_id",
            to: "users_teams.team_id",
          },
          to: "team.id",
        },
      },
    }
  }
}
