import { ArgsType, Field, Int, ObjectType } from "type-graphql"
import { IsNotEmpty, Max, MaxLength } from "class-validator"

import Flair from "../flair.model"

@ObjectType()
export class CreateFlairResponse {
  @Field({ nullable: true })
  flair?: Flair

  @Field({ nullable: true })
  exists?: boolean
}

@ArgsType()
export class CreateFlairInput {
  @Field()
  @IsNotEmpty()
  @MaxLength(20)
  name: string

  @Field(() => Int)
  @Max(360)
  hue: number

  @Field()
  teamId: string
}
