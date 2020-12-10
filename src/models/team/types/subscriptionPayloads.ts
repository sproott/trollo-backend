import User from "../../user/user.model"
import { Field, ObjectType } from "type-graphql"
import Team from "../team.model"

export type TeamDeletedPayload = {
  teamId: string
  participantIds: string[]
}

@ObjectType()
export class TeamUserAddedPayload {
  @Field(() => Team)
  team: Team

  @Field(() => User)
  user: User
}

@ObjectType()
export class TeamUserRemovedPayload {
  @Field(() => String)
  teamId: string

  @Field(() => String)
  userId: string
}
