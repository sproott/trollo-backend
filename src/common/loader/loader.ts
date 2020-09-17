import { Model } from "objection"
import DataLoader from "dataloader"
import { groupBy, map } from "ramda"
import { Util } from "../util/util"

export enum LoaderType {
  SINGLE,
  MULTI,
}

export type LoaderParams = {
  model: typeof Model
  column: string
  type: LoaderType
}

export default class Loader {
  readonly model: typeof Model

  readonly column: string

  readonly columnName: string

  readonly dataLoader;

  [LoaderType.SINGLE] = async (keys: string[]) => {
    let models = await this.query(keys)
    const modelMap: { [key: string]: Model } = {}
    models.forEach((m) => {
      modelMap[m[this.columnName]] = m
    })
    return keys.map((key) => modelMap[key] || null)
  };

  [LoaderType.MULTI] = async (keys: string[]) => {
    let models = await this.query(keys)
    const groupedModels = groupBy((m) => m[this.columnName], models)
    return map((key) => groupedModels[key] || null, keys)
  }

  query = async (keys: string[]) => {
    return this.model.query().whereIn(this.column, keys)
  }

  load = async (key) => {
    return this.dataLoader.load(key)
  }

  constructor({ model, column, type }: LoaderParams) {
    this.column = column
    this.columnName = Util.getColumnName(column)
    this.model = model
    this.dataLoader = new DataLoader<string, Model>(this[type])
  }
}
