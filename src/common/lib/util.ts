import { last } from "ramda"

export const getColumnName = (column: string) => {
  return last(column.split("."))
}

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
