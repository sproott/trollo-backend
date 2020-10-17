import { Field, ObjectType } from "type-graphql"
import Board from "../board.model"

@ObjectType()
export default class CreateBoardResponse {
  @Field({ nullable: true })
  board?: Board

  @Field({ nullable: true })
  exists?: boolean
}
