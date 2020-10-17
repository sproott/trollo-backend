import { Arg, Authorized, Ctx, Mutation, Resolver } from "type-graphql"
import Board from "./board.model"
import Context from "../../common/types/context"
import { raw } from "objection"
import User from "../user/user.model"
import CreateBoardResponse from "./types/createBoard"

@Resolver(Board)
export default class BoardResolver {
  @Authorized()
  @Mutation(() => CreateBoardResponse)
  async createBoard(@Arg("teamId") teamId: string, @Arg("name") name: string, @Ctx() ctx: Context): Promise<CreateBoardResponse> {
    const currentUser = await ctx.getUser()

    const team = await currentUser
      .$relatedQuery("ownTeams")
      .findById(teamId)

    if (!team) return {}

    const existingBoard = await team
      .$relatedQuery("boards")
      .findOne(raw("LOWER(name)"), name.toLowerCase())
    if (!!existingBoard) {
      return { exists: true }
    }

    const newBoard = { name } as Board
    return { board: await team.$relatedQuery("boards").insert(newBoard) }
  }

  @Authorized()
  @Mutation(() => Boolean, { nullable: true })
  async deleteBoard(@Arg("id") id: string, @Ctx() ctx: Context) {
    return (await Board.query()
      .findById(id)
      .whereIn("id",
        User.query()
          .findById(ctx.getUserId())
          .select("ownTeams:boards.id")
          .joinRelated("ownTeams.[boards]")
      )
      .delete()
    ) > 0
  }
}