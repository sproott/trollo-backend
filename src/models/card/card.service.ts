import { Inject, Singleton } from "typescript-ioc"
import ListService from "../list/list.service"
import Card from "./card.model"

@Singleton
export default class CardService {
  @Inject
  private listService: ListService

  nextIndex = async (userId: string, listId: string): Promise<number> => {
    // @ts-ignore
    return (await Card.query().whereIn("list_id", this.listService.list(userId, listId).select("list.id")).max("index"))[0]?.max + 1 || 0
  }

  cards = (userId: string) => {
    return Card.query().whereIn("list_id", this.listService.lists(userId).select("list.id"))
  }

  card = (userId: string, cardId: string) => {
    return this.cards(userId).findById(cardId)
  }
}