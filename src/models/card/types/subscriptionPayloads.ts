import Card from "../card.model"
import { Field, ObjectType } from "type-graphql"
import User from "../../user/user.model"

@ObjectType()
export class CardCreatedPayload {
  @Field(() => Card)
  card: Card
  @Field()
  listId: string
  @Field()
  boardId: string
}

@ObjectType()
export class CardMovedPayload {
  @Field(() => Card)
  card: Card
  @Field()
  destinationListId: string
  @Field()
  sourceIndex: number
  @Field()
  destinationIndex: number
  @Field()
  boardId: string
  userId: string
}

export type CardUpdatedPayload = {
  card: Card
  boardId: string
}

@ObjectType()
export class CardUserAssignedPayload {
  @Field()
  cardId: string
  @Field()
  boardId: string
  @Field(() => User)
  user: User
}

@ObjectType()
export class CardIdBoardIdPayload {
  @Field()
  cardId: string
  @Field()
  boardId: string
}
