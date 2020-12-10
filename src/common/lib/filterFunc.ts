import Context from "../types/context"

export type FilterFuncData<TPayload> = {
  context: Context
  payload: TPayload
}

export const filterFunc = <TPayload, TConverted>(
  converterFunc: (payload: TPayload) => TConverted,
  filterFunc: FilterFuncInner<TConverted>,
  orCondition?: FilterFuncInner<TPayload>
) => {
  return async ({ context, payload }: FilterFuncData<TPayload>) =>
    (await filterFunc({ context, payload: converterFunc(payload) })) ||
    orCondition({ context, payload })
}

export type FilterFuncInner<TPayload> = ({
  context,
  payload,
}: FilterFuncData<TPayload>) => boolean | Promise<boolean>
