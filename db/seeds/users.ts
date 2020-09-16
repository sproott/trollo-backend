import * as Knex from "knex"
import { Crypt } from "../../src/common/crypt"

export async function seed(knex: Knex): Promise<void> {
	await knex("user").del()
	await knex("user").insert([
		{
			username: "bob",
			email: "bob33@gmail.com",
			password: await Crypt.hash("bruhbruhbob"),
		},
		{
			username: "john",
			email: "john03@gmail.com",
			password: await Crypt.hash("bruhbruhjohn"),
		},
		{
			username: "alex",
			email: "alex12@gmail.com",
			password: await Crypt.hash("bruhbruhalex"),
		},
	])
}
