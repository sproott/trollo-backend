import { Field, ID, ObjectType, UseMiddleware } from "type-graphql"
import { Model } from "objection"
import { AutoLoader } from "../../common/loader/autoloaderMiddleware"
import Card from "../card/card.model"

@ObjectType()
export default class List extends Model {
  static get tableName() {
    return "list"
  }

  @Field(() => ID)
  id: string

  @Field()
  name: string

  @UseMiddleware(AutoLoader())
  @Field(() => [Card], { nullable: true })
  cards?: Card[]

  static get relationMappings() {
    return {
      cards: {
        relation: Model.HasManyRelation,
        modelClass: Card,
        join: {
          from: "list.id",
          to: "card.list_id",
        },
      },
    }
  }
}
