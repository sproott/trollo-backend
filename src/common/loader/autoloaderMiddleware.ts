import { MiddlewareFn } from "type-graphql"
import Context from "../types/context"
import { Model } from "objection"
import Loader, { ConditionFn, LoaderType } from "./loader"
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

export const AutoLoader = (params?: {
  relationName?: string
  customCondition?: ConditionFn
}): MiddlewareFn => async ({
  root,
  context,
  info,
}: {
  root: Model
  context: Context
  args: any
  info: any
}) => {
  const model = <typeof Model>Object.getPrototypeOf(root).constructor
  // @ts-ignore
  const field = model.relationMappings[params?.relationName || info.fieldName]
  if (!field) {
    throw new Error(
      `Error: Relation "${info.fieldName}" missing in relation mappings of class "${root.constructor.name}"`
    )
  }
  // @ts-ignore
  let loader: Loader<typeof model>
  if (field.relation.name in mappings) {
    loader = context.loaderContainer.getLoader({
      ...mappings[field.relation.name],
      fieldName: info.fieldName,
      relationName: params?.relationName || info.fieldName,
      model,
    })
  } else {
    throw new Error("Unsupported: AutoLoad given an unknown relation.")
  }
  // @ts-ignore
  const id = root[getColumnName(field.join.from)]
  if (id === null) {
    return null
  } else {
    return loader.load(id, params?.customCondition)
  }
}
