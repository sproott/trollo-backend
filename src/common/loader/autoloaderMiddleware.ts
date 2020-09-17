import { MiddlewareFn } from "type-graphql"
import GraphqlPassportContext from "../types/context"
import { Model } from "objection"
import Loader, { LoaderType } from "./loader"
import { Util } from "../util"

export const AutoLoader: MiddlewareFn = async ({
  root,
  context,
  args,
  info,
}: {
  root: Model
  context: GraphqlPassportContext
  args: any
  info: any
}) => {
  const rootClass = <typeof Model>Object.getPrototypeOf(root).constructor
  const field = rootClass.relationMappings[info.fieldName]
  const idColumn = rootClass.idColumn
  const mappings = {
    [Model.HasManyRelation.name]: {
      type: LoaderType.MULTI,
    },
    [Model.BelongsToOneRelation.name]: {
      type: LoaderType.SINGLE,
    },
  }
  let loader: Loader
  if (field.relation.name in mappings) {
    loader = context.loaderContainer.getLoader({
      ...mappings[field.relation.name],
      column: field.join.to,
      model: field.modelClass,
    })
  } else {
    throw new Error("Unsupported: AutoLoad given an unknown relation.")
  }
  if (typeof idColumn == "string") {
    return loader.load(root[Util.getColumnName(field.join.from)])
  } else {
    throw new Error("Unsupported: Loader.load given array of keys.")
  }
}
