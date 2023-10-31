import { NextFunction, Request, Response } from 'express'
import { omit } from 'lodash'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  //   LỖI TỪ CÁC NƠI SẼ DỒN VỀ ĐÂY
  if (err instanceof ErrorWithStatus) {
    return res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(omit(err, ['status']))
  }
  // NẾU MÀ LỖI XUỐNG ĐƯỢC ĐÂY
  // SET NAME, STACK, MESSAGE VỀ ENUMERABLE : TRUE
  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true })
  })
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfor: omit(err, ['stack'])
  })
}
