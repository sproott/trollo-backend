import { Field, ObjectType } from "type-graphql"
import List from "../list.model"

export type ListDeletedPayload = {
  listId: string
  boardId: string
}

@ObjectType()
export class ListMovedPayload {
  @Field()
  list: List
  @Field()
  sourceIndex: number
  @Field()
  destinationIndex: number
  userId: string
}
