import { Field, ObjectType } from "type-graphql"

@ObjectType()
export default class AddUserResponse {
  @Field({ nullable: true })
  userId?: string

  @Field({ nullable: true })
  username?: string

  @Field({ nullable: true })
  alreadyInTeam?: boolean

  @Field({ nullable: true })
  doesNotExist?: boolean
}
