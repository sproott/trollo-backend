import { Field, ObjectType } from "type-graphql"

import Team from "../../team/team.model"

@ObjectType()
export default class JoinUsingInviteResponse {
  @Field({ nullable: true })
  team?: Team

  @Field({ nullable: true })
  alreadyInTeam?: boolean
}
