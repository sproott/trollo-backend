import Context from "../types/context"

export type FilterFuncData<TPayload, TArgs = undefined> = {
  context: Context
  payload: TPayload
  args?: TArgs
}

export const filterFunc = <TPayload, TConverted, TArgs = undefined>(
  converterFunc: (payload: TPayload) => TConverted,
  filterFunc: FilterFuncInner<TConverted, TArgs>,
  orCondition?: FilterFuncInner<TPayload, TArgs>
) => {
  return async ({ context, payload }: FilterFuncData<TPayload>) =>
    (await filterFunc({ context, payload: converterFunc(payload) })) ||
    orCondition({ context, payload })
}

export type FilterFuncInner<TPayload, TArgs = undefined> = ({
  context,
  payload,
  args,
}: FilterFuncData<TPayload, TArgs>) => boolean | Promise<boolean>
