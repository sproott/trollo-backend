import LoaderContainer from "../loader/loaderContainer"
import User from "../../user/user.model"
import { PassportContext } from "graphql-passport"
import { Request as ExpressRequest } from "express"
import { LoginInput } from "../../user/user.input"

export default interface Context
  extends PassportContext<User, LoginInput, ExpressRequest> {
  loaderContainer: LoaderContainer
}
