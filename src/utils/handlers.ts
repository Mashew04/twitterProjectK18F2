import { NextFunction, Request, RequestHandler, Response } from 'express'

export const wrapAsync = <P>(func: RequestHandler<P>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    // TẠO RA CẤU TRÚC TRYCATCH
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
