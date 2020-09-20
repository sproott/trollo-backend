export class RegisterError extends Error {
  email: string

  username: string

  constructor(message: string) {
    super(message)
  }
}
