import { Request, Response } from 'express'
import User from '~/models/schemas/User.schema'
import databaseServices from '~/services/database.services'
import usersService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody } from '~/models/requests/User.request'

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body

  if (email === 'test@gmail.com' && password === '123456') {
    return res.json({
      message: 'Login Successfully ',
      result: [
        { name: 'Điệp', yob: 1999 },
        { name: 'Điệp', yob: 2003 },
        { name: 'Điệp', yob: 1994 }
      ]
    })
  }
  return res.status(400).json({
    error: 'Login Failed'
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  try {
    const result = await usersService.register(req.body)
    res.json({
      message: 'Register Successfully',
      result
    })
  } catch (error) {
    res.status(400).json({
      message: 'Register Failed',
      error
    })
  }
}
