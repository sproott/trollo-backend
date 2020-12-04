import { Field, ObjectType } from "type-graphql"

@ObjectType()
export class RenameResponse {
  @Field({ nullable: true })
  success?: boolean

  @Field({ nullable: true })
  exists?: boolean
}
