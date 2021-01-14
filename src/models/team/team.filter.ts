import { Container } from "typescript-ioc"
import { FilterFunc } from "../../common/lib/filterFunc"
import TeamService from "./team.service"

const teamService = Container.get(TeamService)

export const teamParticipantFilter: FilterFunc<string> = async ({ context, payload }) => {
  return !!(await teamService.team(context.userId, payload))
}
