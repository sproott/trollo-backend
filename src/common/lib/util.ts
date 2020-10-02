import { last } from "ramda"

export const getColumnName = (column: string) => {
  return last(column.split("."))
}

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export const isProduction = () => {
  return process.env.NODE_ENV == "production"
}
