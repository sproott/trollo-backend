import { Inject, Singleton } from "typescript-ioc"
import ListService from "../list/list.service"
import Card from "./card.model"

@Singleton
export default class CardService {
  @Inject
  private listService: ListService

  nextIndex = async (userId: string, listId: string): Promise<number> => {
    const maxIndex = ((
      await Card.query()
        .whereIn("list_id", this.listService.list(userId, listId).select("list.id"))
        .max("index")
    )[0] as any).max
    return maxIndex === null ? 0 : maxIndex + 1
  }

  cards = (userId: string) => {
    return Card.query().whereIn("list_id", this.listService.lists(userId).select("list.id"))
  }

  card = (userId: string, cardId: string) => {
    return this.cards(userId).findById(cardId)
  }
}
