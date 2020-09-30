import bcrypt from "bcrypt"

export const hash = (str: string, saltRounds = 10) => {
  return bcrypt.hash(str, saltRounds)
}

export const compare = (str: string, hash: string) => {
  return bcrypt.compare(str, hash)
}
