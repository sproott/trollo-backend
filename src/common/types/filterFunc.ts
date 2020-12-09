import Context from "./context"

type FilterFunc<TPayload> = ({
  context,
  payload,
}: {
  context: Context
  payload: TPayload
}) => boolean | Promise<boolean>

export default FilterFunc
