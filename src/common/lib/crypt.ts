import bcrypt from "bcrypt"

export namespace crypt {
  export function hash(str: string, saltRounds = 10) {
    return bcrypt.hash(str, saltRounds)
  }

  export function compare(str: string, hash: string) {
    return bcrypt.compare(str, hash)
  }
}
