import Objection, { Model, Relation } from "objection"
import DataLoader from "dataloader"
import { groupBy, map } from "ramda"

export enum LoaderType {
  BelongsToOne,
  HasMany,
  ManyToMany,
}

export type LoaderParams = { model: typeof Model; fieldName: string; type: LoaderType }

const col = (prop: Objection.RelationProperty) => {
  return prop.cols[0]
}

const mapKeysToModels = (keys: string[], models: { [key: string]: Model[] }) => {
  return map((key) => models[key] || undefined, keys)
}

export default class Loader {
  readonly model: typeof Model

  readonly relation: Relation

  readonly dataLoader;

  [LoaderType.BelongsToOne] = async (keys: string[]) => {
    const models = await this.query(keys)
    const modelMap: { [key: string]: Model } = {}
    models.forEach((m) => {
      // @ts-ignore
      modelMap[m[this.relatedColumnName]] = m
    })
    return map((key) => modelMap[key] || undefined, keys)
  };

  [LoaderType.HasMany] = async (keys: string[]) => {
    const models = await this.query(keys)
    // @ts-ignore
    const groupedModels = groupBy((m) => m[this.relatedColumnName], models)
    return mapKeysToModels(keys, groupedModels)
  };

  [LoaderType.ManyToMany] = async (keys: string[]) => {
    const models = await this.relatedModel
      .query()
      .select(this.joinTableOwnerColumn, this.relatedModel.tableName + ".*")
      .join(this.joinTableName, this.relatedColumn, this.joinTableRelatedColumn)
      .whereIn(this.joinTableOwnerColumn, keys)
    // @ts-ignore
    const groupedModels = groupBy((m) => m[this.joinTableOwnerColumnName], models)
    return mapKeysToModels(keys, groupedModels)
  }

  query = async (keys: string[]) => {
    return this.relatedModel.query().whereIn(this.relatedColumn, keys)
  }

  load = async (key: string) => {
    return this.dataLoader.load(key)
  }

  constructor({ model, fieldName, type }: LoaderParams) {
    this.model = model
    this.relation = model.getRelation(fieldName)
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
