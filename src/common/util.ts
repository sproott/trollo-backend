import { last } from "ramda"

export class Util {
  private Util() {}

  static getColumnName(column: string): string {
    return last(column.split("."))
  }
}
