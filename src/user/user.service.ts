import { Singleton } from "typescript-ioc"
import User from "./user.model"

@Singleton
export class UserService {
	findById(id: number): Promise<User> {
		return User.query().findById(id)
	}

	findByUsername(username: string) {
		return this.findBy("username", username).then((users) => users[0])
	}

	findByEmail(email: string) {
		return this.findBy("email", email).then((users) => users[0])
	}

	private findBy(column: string, value: string): Promise<User[]> {
		return User.query().where(column, "=", value)
	}
}
