import Objection, { Model, Relation } from "objection"
import { groupBy, map } from "ramda"

import DataLoader from "dataloader"

export enum LoaderType {
  BelongsToOne,
  HasMany,
  ManyToMany,
}

export type ConditionFn = (
  qb: Objection.QueryBuilder<Objection.Model, Objection.Model[]>
) => Objection.QueryBuilder<Objection.Model, Objection.Model[]>

export type LoaderParams = {
  model: typeof Model
  relationName: string
  type: LoaderType
}

const col = (prop: Objection.RelationProperty) => {
  return prop.cols[0]
}

const mapKeysToModels = (keys: string[], models: { [key: string]: Model[] }) => {
  return map((key) => models[key] ?? [], keys)
}

export default class Loader {
  readonly model: typeof Model

  readonly relation: Relation

  readonly dataLoader

  customCondition?: ConditionFn;

  [LoaderType.BelongsToOne] = async (keys: string[]) => {
    const query = this.query(keys)
    const models = await this.process(query)
    const modelMap: { [key: string]: Model } = {}
    models.forEach((m) => {
      // @ts-ignore
      modelMap[m[this.relatedColumnName]] = m
    })
    return map((key) => modelMap[key] ?? undefined, keys)
  };

  [LoaderType.HasMany] = async (keys: string[]) => {
    const query = this.query(keys)
    const models = await this.process(query)
    // @ts-ignore
    const groupedModels = groupBy((m) => m[this.relatedColumnName], models)
    return mapKeysToModels(keys, groupedModels)
  };

  [LoaderType.ManyToMany] = async (keys: string[]) => {
    const query = this.relatedModel
      .query()
      .select(
        this.joinTableOwnerColumn,
        this.relatedModel.tableName + ".*",
        this.joinTableName + ".*"
      )
      .join(this.joinTableName, this.relatedColumn, this.joinTableRelatedColumn)
      .whereIn(this.joinTableOwnerColumn, keys)
    const models = await this.process(query)
    // @ts-ignore
    const groupedModels = groupBy((m) => m[this.joinTableOwnerColumnName], models)
    return mapKeysToModels(keys, groupedModels)
  }

  query = (keys: string[]) => {
    return this.relatedModel.query().whereIn(this.relatedColumn, keys)
  }

  process = async (query: Objection.QueryBuilder<Objection.Model, Objection.Model[]>) => {
    return !!this.customCondition ? this.customCondition(query) : query
  }

  load = async (key: string, customCondition?: ConditionFn) => {
    this.customCondition = customCondition
    return await this.dataLoader.load(key)
  }

  constructor({ model, relationName, type }: LoaderParams) {
    this.model = model
    this.relation = model.getRelation(relationName)
    if (type === LoaderType.BelongsToOne) {
      this.dataLoader = new DataLoader<string, Model>(this[type])
    } else {
      this.dataLoader = new DataLoader<string, Model[]>(this[type])
    }
  }

  get joinTableName() {
    return this.relation.joinTable
  }

  get joinTableOwnerColumn() {
    return this.joinTableName + "." + this.joinTableOwnerColumnName
  }

  get joinTableOwnerColumnName() {
    return col(this.relation.joinTableOwnerProp)
  }

  get joinTableRelatedColumn() {
    return this.joinTableName + "." + col(this.relation.joinTableRelatedProp)
  }

  get relatedModel() {
    return this.relation.relatedModelClass
  }

  get relatedColumn() {
    return this.relatedModel.tableName + "." + this.relatedColumnName
  }

  get relatedColumnName() {
    return col(this.relation.relatedProp)
  }
}
