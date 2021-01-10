import { Container } from "typescript-ioc"
import { FilterFuncInner } from "../../common/lib/filterFunc"
import { TeamIdArgs } from "../../common/types/argTypes"
import TeamService from "./team.service"

const teamService = Container.get(TeamService)

export const teamParticipantFilter: FilterFuncInner<string> = async ({ context, payload }) => {
  return !!(await teamService.team(context.userId, payload))
}
