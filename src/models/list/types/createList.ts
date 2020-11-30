import { Field, ObjectType } from "type-graphql"
import List from "../list.model"

@ObjectType()
export default class CreateListResponse {
  @Field({ nullable: true })
  list?: List

  @Field({ nullable: true })
  exists?: boolean
}
