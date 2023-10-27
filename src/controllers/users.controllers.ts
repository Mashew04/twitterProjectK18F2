import { Request, Response } from 'express'
import User from '~/models/schemas/User.schema'
import databaseServices from '~/services/database.services'
import usersService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody } from '~/models/requests/User.request'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/messages'

export const loginController = async (req: Request, res: Response) => {
  // LẤY USER_ID TỪ USER REQ
  const user = req.user as User
  const user_id = user._id as ObjectId
  // DÙNG USER_ID TẠO ACCESS_TOKEN VÀ REFRESH_TOKEN
  const result = await usersService.login(user_id.toString())
  // RES ACCESS_TOKEN VÀ REFRESH_TOKEN CHO CLIENT
  res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const result = await usersService.register(req.body)
  res.json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  })
}
export const logoutController = async (req: Request, res: Response) => {
  const { refresh_token } = req.body
  // LOGOUT SẼ NHẬN VÀO REFRESH_TOKEN ĐỂ TÌM VÀ XÓA
  const result = await usersService.logout(refresh_token)
  res.json(result)
}
