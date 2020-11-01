import { Field, ID, ObjectType, UseMiddleware } from "type-graphql"
import { Model, RelationMappings } from "objection"
import { AutoLoader } from "../../common/loader/autoloaderMiddleware"
import { Participant } from "../participant/participant.model"

@ObjectType()
export default class User extends Model {
  static get tableName() {
    return "user"
  }

  @Field(() => ID)
  id: string

  @Field()
  username: string

  @Field()
  email: string

  password: string

  @UseMiddleware(
    AutoLoader({
      relationName: "participants",
      customCondition: (qb) => {
        return qb.where("participant.owner", true)
      },
    })
  )
  @Field(() => [Participant])
  owns: Participant[]

  @UseMiddleware(
    AutoLoader({
      relationName: "participants",
      customCondition: (qb) => {
        return qb.where("participant.owner", false)
      },
    })
  )
  @Field(() => [Participant])
  participatesIn: Participant[]

  @Field()
  is_admin: boolean

  static get relationMappings(): RelationMappings {
    return {
      participants: {
        relation: Model.HasManyRelation,
        modelClass: Participant,
        join: {
          from: "user.id",
          to: "participant.user_id",
        },
      },
    }
  }
}
