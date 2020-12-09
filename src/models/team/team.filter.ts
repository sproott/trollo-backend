import FilterFunc from "../../common/types/filterFunc"
import Team from "./team.model"
import TeamService from "./team.service"
import { Container } from "typescript-ioc"

const teamService = Container.get(TeamService)

const teamFilter: FilterFunc<Team> = async ({ context, payload }) => {
  return !!(await teamService.team(context.userId, payload.id))
}

export default teamFilter
