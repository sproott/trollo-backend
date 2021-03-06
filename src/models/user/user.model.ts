import { Authorized, Field, ID, ObjectType, UseMiddleware } from "type-graphql"
import { IsEmail, IsNotEmpty, Length, MaxLength } from "class-validator"
import { Model, RelationMappings } from "objection"

import { AutoLoader } from "../../common/loader/autoloaderMiddleware"
import { Participant } from "../participant/participant.model"
import Role from "../../auth/types/role"

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
  @Authorized(Role.OWNER)
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
  @Authorized(Role.OWNER)
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
