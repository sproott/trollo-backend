import { Inject, Singleton } from "typescript-ioc"

import Flair from "./flair.model"
import TeamService from "../team/team.service"

@Singleton
export default class FlairService {
  @Inject
  private teamService: TeamService

  flairs = (userId: string) => {
    return Flair.query().whereIn("team_id", this.teamService.teams(userId).select("team.id"))
  }

  flair = (userId: string, flairId: string) => {
    return this.flairs(userId).findById(flairId)
  }
}
