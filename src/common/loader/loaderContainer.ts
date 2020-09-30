import Loader, { LoaderParams } from "./loader"

export default class LoaderContainer {
  readonly loaders: Map<string, Loader> = new Map()

  getLoader(params: LoaderParams) {
    let { model, fieldName, type } = params
    let jsonParams = JSON.stringify({ table: model.tableName, fieldName, type })
    return this.loaders.get(jsonParams) || this.createNew(params, jsonParams)
  }

  private createNew(params: LoaderParams, jsonParams: string) {
    const loader = new Loader(params)
    this.loaders.set(jsonParams, loader)
    return loader
  }
}
