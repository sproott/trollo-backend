import { MiddlewareFn } from "type-graphql"
import Context from "../types/context"
import { Model } from "objection"
import Loader, { LoaderType } from "./loader"
import { getColumnName } from "../lib/util"

const mappings = {
  [Model.HasManyRelation.name]: {
    type: LoaderType.HasMany,
  },
  [Model.BelongsToOneRelation.name]: {
    type: LoaderType.BelongsToOne,
  },
  [Model.ManyToManyRelation.name]: {
    type: LoaderType.ManyToMany,
  },
}

export const AutoLoader: MiddlewareFn = async ({
  root,
  context,
  args,
  info,
}: {
  root: Model
  context: Context
  args: any
  info: any
}) => {
  const model = <typeof Model>Object.getPrototypeOf(root).constructor
  // @ts-ignore
  const field = model.relationMappings[info.fieldName]
  if (!field) {
    throw new Error(
      `Error: Relation "${info.fieldName}" missing in relation mappings of class "${root.constructor.name}"`
    )
  }
  const idColumn = model.idColumn
  let loader: Loader
  if (field.relation.name in mappings) {
    loader = context.loaderContainer.getLoader({
      ...mappings[field.relation.name],
      fieldName: info.fieldName,
      model,
    })
  } else {
    throw new Error("Unsupported: AutoLoad given an unknown relation.")
  }
  if (typeof idColumn == "string") {
    // @ts-ignore
    return loader.load(root[getColumnName(field.join.from)])
  } else {
    throw new Error("Unsupported: Loader.load given array of keys.")
  }
}
