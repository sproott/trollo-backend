import { Field, ID, ObjectType } from "type-graphql"
import { Model } from "objection"

@ObjectType()
export default class User extends Model {
	static get tableName() {
		return "user"
	}

	@Field(() => ID)
	id: string

	@Field()
	username: string

	@Field()
	email: string

	password: string
}
