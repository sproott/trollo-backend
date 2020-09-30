import { v4 as uuid } from "uuid"
import { Model, QueryContext } from "objection"
import { hash } from "./crypt"

const withHashedPassword = (model: typeof Model) => {
  return class extends Model {
    password: string

    /**
     * Before insert.
     */
    $beforeInsert = async (context: QueryContext) => {
      await super.$beforeInsert(context)
      this.password = await hash(this.password)
    }
  }
}

export default withHashedPassword
