import bcrypt from "bcrypt"

export class Crypt {
  private Crypt() {}

  static hash(str: string, saltRounds = 10) {
    return bcrypt.hash(str, saltRounds)
  }

  static compare(str, hash) {
    return bcrypt.compare(str, hash)
  }
}
