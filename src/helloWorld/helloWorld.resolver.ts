import { Arg, Query, Resolver } from "type-graphql"
import HelloWorld from "./helloWorld.model"

@Resolver(HelloWorld)
export default class HelloWorldResolver {
	@Query(() => HelloWorld)
	async greeting(@Arg("name", { nullable: true }) name: string) {
		const helloWorld = new HelloWorld()
		helloWorld.greeting = "Hello, " + (name == null ? "World" : name)
		return helloWorld
	}
}
