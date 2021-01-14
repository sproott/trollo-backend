import Context from "../types/context"

export type FilterFuncData<TPayload, TArgs = undefined> = {
  context: Context
  payload: TPayload
  args?: TArgs
}

export type FilterFunc<TPayload, TArgs = undefined> = (
  args: FilterFuncData<TPayload, TArgs>
) => boolean | Promise<boolean>

export const and = <TPayload, TArgs = undefined>(
  filter1: FilterFunc<TPayload, TArgs>,
  filter2: FilterFunc<TPayload, TArgs>
): FilterFunc<TPayload, TArgs> => {
  return async (args) => (await filter1(args)) && (await filter2(args))
}

export const or = <TPayload, TArgs = undefined>(
  filter1: FilterFunc<TPayload, TArgs>,
  filter2: FilterFunc<TPayload, TArgs>
): FilterFunc<TPayload, TArgs> => {
  return async (args) => (await filter1(args)) || (await filter2(args))
}

export const transform = <TPayload, TPayloadResult, TArgs = undefined>(
  transform: (payload: TPayload) => TPayloadResult,
  filter: FilterFunc<TPayloadResult, TArgs>
): FilterFunc<TPayload, TArgs> => {
  return (args) => filter({ ...args, payload: transform(args.payload) })
}
