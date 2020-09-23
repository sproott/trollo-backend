import { Field, InputType } from "type-graphql"
import { Contains, Length, MaxLength } from "class-validator"

@InputType()
export class RegisterInput {
  @Field()
  @MaxLength(20)
  username: string

  @Field()
  @MaxLength(254)
  @Contains("@")
  email: string

  @Field()
  @Length(8, 32)
  password: string
}

@InputType()
export class LoginInput {
  @Field()
  @MaxLength(254)
  usernameOrEmail: string

  @Field()
  @Length(8, 32)
  password: string
}
