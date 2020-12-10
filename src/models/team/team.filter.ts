import TeamService from "./team.service"
import { Container } from "typescript-ioc"
import { FilterFuncInner } from "../../common/lib/filterFunc"

const teamService = Container.get(TeamService)

const teamParticipantFilter: FilterFuncInner<string> = async ({ context, payload }) => {
  return !!(await teamService.team(context.userId, payload))
}

export default teamParticipantFilter
