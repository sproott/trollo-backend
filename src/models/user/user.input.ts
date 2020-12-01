import { Field, InputType } from "type-graphql"
import { IsEmail, IsNotEmpty, Length, MaxLength } from "class-validator"

@InputType()
export class RegisterInput {
  @Field()
  @IsNotEmpty()
  @MaxLength(20)
  username: string

  @Field()
  @Length(3, 254)
  @IsEmail()
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
