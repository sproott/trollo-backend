import { Field, ObjectType } from "type-graphql"

@ObjectType()
export default class RenameTeamResponse {
  @Field({ nullable: true })
  success?: boolean

  @Field({ nullable: true })
  exists?: boolean
}
