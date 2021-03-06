import Team from "../team.model"
import { Field, ObjectType } from "type-graphql"

@ObjectType()
export default class CreateTeamResponse {
  @Field({ nullable: true })
  team?: Team

  @Field({ nullable: true })
  exists?: boolean
}
