import { Field, ObjectType } from "type-graphql"

import Flair from "../flair.model"

@ObjectType()
export class FlairTeamIdPayload {
  @Field(() => Flair)
  flair: Flair
  @Field()
  teamId: string
}

@ObjectType()
export class FlairIdTeamIdPayload {
  @Field()
  flairId: string
  @Field()
  teamId: string
}
