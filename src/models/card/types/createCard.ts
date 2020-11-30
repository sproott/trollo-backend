import { Field, ObjectType } from "type-graphql"
import Card from "../card.model";

@ObjectType()
export default class CreateCardResponse {
  @Field({ nullable: true })
  card?: Card

  @Field({ nullable: true })
  exists?: boolean
}
