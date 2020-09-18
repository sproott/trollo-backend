import { last } from "ramda"

export namespace util {
  export function getColumnName(column: string): string {
    return last(column.split("."))
  }

  export function sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }
}
