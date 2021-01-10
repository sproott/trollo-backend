import Card from "../card/card.model"
import { Participant } from "../participant/participant.model"
import { Singleton } from "typescript-ioc"
import Team from "./team.model"

@Singleton
export default class TeamService {
  ownTeams = (userId: string) => {
    return this.teams(userId, true)
  }

  teams = (userId: string, owner: boolean = undefined) => {
    const baseQuery = Team.query().joinRelated("participants").where("participants.user_id", userId)
    return owner === undefined ? baseQuery : baseQuery.andWhere("participants.owner", owner)
  }

  team = (userId: string, teamId: string) => {
    return this.teams(userId).findById(teamId)
  }

  ownTeam = (userId: string, teamId: string) => {
    return this.ownTeams(userId).findById(teamId)
  }

  removeUser = async (team: Team, userId: string) => {
    await Card.query()
      .patch({ assignee_id: null })
      .whereIn(
        "card.id",
        Team.query()
          .for(team.id)
          .joinRelated("boards.[lists.[cards]]")
          .select("boards:lists:cards.id")
      )
      .where("card.assignee_id", userId)
    return Participant.query().delete().where("user_id", userId).andWhere("team_id", team.id)
  }
}
