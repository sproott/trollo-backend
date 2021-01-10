import Context from "../types/context"

export type FilterFuncData<TPayload, TArgs = undefined> = {
  context: Context
  payload: TPayload
  args?: TArgs
}

export type ConditionFuncData<TPayload, TArgs = undefined> = FilterFuncData<TPayload, TArgs> & {
  filterResult: boolean
}

export const filterFunc = <TPayload, TConverted, TArgs = undefined>(
  converterFunc: (payload: TPayload) => TConverted,
  filterFunc: FilterFuncInner<TConverted, TArgs>,
  condition?: ConditionFunc<TPayload, TArgs>
) => {
  return async ({ context, payload, args }: FilterFuncData<TPayload>) => {
    const filterResult = await filterFunc({ context, payload: converterFunc(payload), args })
    return condition ? condition({ context, payload, args, filterResult }) : filterResult
  }
}

export type ConditionFunc<TPayload, TArgs = undefined> = (
  args: ConditionFuncData<TPayload, TArgs>
) => boolean | Promise<boolean>

export type FilterFuncInner<TPayload, TArgs = undefined> = (
  args: FilterFuncData<TPayload, TArgs>
) => boolean | Promise<boolean>
