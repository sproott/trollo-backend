import { Field, ObjectType } from "type-graphql"

import { NotContains } from "class-validator"
import User from "../user.model"

@ObjectType()
export class RegisterError {
  @Field({ nullable: true })
  @NotContains("@")
  email?: boolean

  @Field({ nullable: true })
  username?: boolean
}

@ObjectType()
export class RegisterResponse {
  @Field({ nullable: true })
  user?: User

  @Field({ nullable: true })
  error?: RegisterError
}
