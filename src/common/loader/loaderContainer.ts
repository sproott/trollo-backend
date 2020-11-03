import Loader, { LoaderParams } from "./loader"
import stringify from "fast-json-stable-stringify"

export default class LoaderContainer {
  readonly loaders: Map<string, Loader> = new Map()

  getLoader(params: LoaderParams & { fieldName: string }) {
    let { model, fieldName, type } = params
    let jsonParams = stringify({ table: model.tableName, fieldName, type })
    return this.loaders.get(jsonParams) || this.createNew(params, jsonParams)
  }

  private createNew(params: LoaderParams & { fieldName: string }, jsonParams: string) {
    const loader = new Loader(params)
    this.loaders.set(jsonParams, loader)
    return loader
  }
}
