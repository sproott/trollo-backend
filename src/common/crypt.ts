import bcrypt from "bcrypt"

export class Crypt {
	private Crypt() {}

	static hash(str: string, saltRounds = 10): Promise<string> {
		return bcrypt.hash(str, saltRounds)
	}

	static compare(str, hash): Promise<boolean> {
		return bcrypt.compare(str, hash)
	}
}
