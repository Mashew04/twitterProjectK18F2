import { NextFunction, Request, RequestHandler, Response } from 'express'

export const wrapAsync = (func: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // TẠO RA CẤU TRÚC TRYCATCH
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
