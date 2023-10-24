import { Request, Response, NextFunction } from 'express'
import { body, validationResult, ValidationChain } from 'express-validator'
// can be reused by many routes
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import { EntityError, ErrorWithStatus } from '~/models/Errors'

// sequential processing, stops running validations chain if the previous one fails.
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req)

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }
    const errorObject = errors.mapped()
    const entityError = new EntityError({ errors: {} })
    // XỬ LÍ errorObject
    for (const key in errorObject) {
      // LẤY MESS CỦA TỪNG CÁI LỖI
      const { msg } = errorObject[key]
      // NẾU MÀ MESS CÓ DẠNG ErrorWithStatus và Status !== 422 thì ném
      // cho default error handler
      if (msg instanceof ErrorWithStatus && msg.status !== 422) {
        return next(msg)
      }

      // LƯU CÁC LỖI 422 TỪ ERROROBJECT VÀO ENTITYERROR
      entityError.errors[key] = msg
    }
    //  Ở ĐÂY XỬ LÍ LỖI LUÔN CHỨ KHÔNG NÉM VỀ ERROR HANDLER TỔNG
    next(entityError)
  }
}
