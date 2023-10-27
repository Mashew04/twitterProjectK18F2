import { Request, Response } from 'express'
import User from '~/models/schemas/User.schema'
import databaseServices from '~/services/database.services'
import usersService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody } from '~/models/requests/User.request'

export const loginController = async (req: Request, res: Response) => {
  throw new Error('Test Lỗi')
  // LẤY USER_ID TỪ USER REQ
  const { user }: any = req
  const user_id = user._id
  // DÙNG USER_ID TẠO ACCESS_TOKEN VÀ REFRESH_TOKEN
  const result = await usersService.login(user_id.toString())
  // RES ACCESS_TOKEN VÀ REFRESH_TOKEN CHO CLIENT
  res.json({
    message: 'Login Successfully',
    result
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const result = await usersService.register(req.body)
  res.json({
    message: 'Register Successfully',
    result
  })
}
