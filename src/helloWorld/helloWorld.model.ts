import { Field, ObjectType } from "type-graphql"

@ObjectType()
export default class HelloWorld {
  @Field()
  greeting: string
}
