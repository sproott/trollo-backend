import Board from "../board.model"
import { Field, ObjectType } from "type-graphql"

@ObjectType()
export class BoardCreatedPayload {
  @Field()
  teamId: string

  @Field(() => Board)
  board: Board
}

export type BoardDeletedPayload = {
  boardId: string
  participantIds: string[]
}
