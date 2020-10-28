import { Field, ID, ObjectType } from "type-graphql"
import { Model } from "objection"

@ObjectType()
export default class Card extends Model {
  static get tableName() {
    return "card"
  }

  @Field(() => ID)
  id: string

  @Field()
  name: string
}
