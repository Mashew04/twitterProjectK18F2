import { NextFunction, Request, Response } from 'express'
import User from '~/models/schemas/User.schema'
import usersService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  LogoutReqBody,
  RegisterReqBody,
  LoginReqBody,
  TokenPayload,
  VerifyEmailReqqBody,
  ResetPasswordReqBody,
  UpdateMeReqBody,
  GetProfileReqParams,
  FollowReqBody,
  UnfollowReqParams,
  ChangePasswordReqBody,
  RefreshTokenReqBody
} from '~/models/requests/User.request'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/messages'
import databaseServices from '~/services/database.services'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { UserVerifyStatus } from '~/constants/enums'

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  // LẤY USER_ID TỪ USER REQ
  const user = req.user as User
  const user_id = user._id as ObjectId
  // DÙNG USER_ID TẠO ACCESS_TOKEN VÀ REFRESH_TOKEN
  const result = await usersService.login({ user_id: user_id.toString(), verify: user.verify })
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
export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  // LOGOUT SẼ NHẬN VÀO REFRESH_TOKEN ĐỂ TÌM VÀ XÓA
  const result = await usersService.logout(refresh_token)
  res.json(result)
}

export const emailVerifyTokenController = async (
  req: Request<ParamsDictionary, any, VerifyEmailReqqBody>,
  res: Response
) => {
  // NẾU MÀ CODE ĐƯỢC ĐÂY THÌ EMAIL_VERIFY_TOKEN HỢP LỆ
  // VÀ MÌNH ĐÃ LẤY ĐƯỢC DECODED_EMAIL_VERIFY_TOKEN
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  // DỰA VÀO USER_ID TÌM USER VÀ XEM HỬ NÓ ĐÃ VERIFY CHƯA ?
  const user = await databaseServices.users.findOne({ _id: new ObjectId(user_id) })
  if (user === null) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }

  // NẾU ĐÃ VERIFY THÌ KHÔNG CÒN VERIFY LẠI NỮA
  if (user.verify !== UserVerifyStatus.Unverified && user.email_verify_token === '') {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  // NẾU MÀ KHÔNG KHỚP EMIAL_VERIFY_TOKEN
  if (user.email_verify_token !== (req.body.email_verify_token as string)) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INCORRECT,
      status: HTTP_STATUS.UNAUTHORIZED
    })
  }
  // NẾU MÀ XUỐNG ĐƯỢC ĐÂY CÓ NGHĨA LÀ USER CHƯA VERIFY
  // MÌNH SẼ UPDATE LẠI USER ĐÓ
  const result = await usersService.verifyEmail(user_id)
  return res.json({
    message: USERS_MESSAGES.VERIFY_EMAIL_SUCCESS,
    result
  })
}

export const resendEmailVerifyController = async (req: Request, res: Response) => {
  // NẾU VÀO ĐƯỢC ĐÂY CÓ NGHĨA LÀ ACCESS_TOKEN HỢP LỆ
  // VÀ MÌNH ĐÃ LẤY ĐƯỢC DECODED_AUTHORIZATION
  const { user_id } = req.decoded_authorization as TokenPayload
  // DỰA VÀO USER_ID TÌM USER VÀ XEM THỬ NÓ ĐÃ VERIFY CHƯA ?
  const user = await databaseServices.users.findOne({ _id: new ObjectId(user_id) })
  if (user === null) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }
  if (user.verify !== UserVerifyStatus.Unverified && user.email_verify_token === '') {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  if (user.verify === UserVerifyStatus.Banned) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_BANNED,
      status: HTTP_STATUS.FORBIDDEN // 403
    })
  }
  const result = await usersService.resendEmailVerify(user_id)
  return res.json(result)
}

export const forgotPasswordController = async (req: Request, res: Response) => {
  // LẤY USER_ID TỪ USER CỦA REQ
  const { _id, verify } = req.user as User
  // DÙNG _ID TÌM VÀ CẬP NHẬT LẠI USER THÊM VÀO forgot_password_token
  const result = await usersService.forgotPassword({ user_id: (_id as ObjectId).toString(), verify })
  return res.json(result)
}
export const verifyForgotPasswordTokenController = async (req: Request, res: Response) => {
  return res.json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response
) => {
  // MUỐN ĐỔI MK THÌ CẦN USER_ID VÀ PASSWORD MỚI
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body
  //CẬP NHẬT
  const result = await usersService.resetPassword({ user_id, password })
  return res.json(result)
}

export const getMeController = async (req: Request, res: Response) => {
  // MUỐN LẤY PROFILE CỦA MÌNH THÌ CẦN USER_ID CỦA MÌNH
  const { user_id } = req.decoded_authorization as TokenPayload
  // DÙNG USERR_ID ĐỂ TÌM USER
  const user = await usersService.getMe(user_id)
  return res.json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: user
  })
}

export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeReqBody>, res: Response) => {
  // MUỐN UPDATE THÌ CẦN USER_ID CỦA MÌNH VÀ CÁC THÔNG TIN CẦN UPDATE
  const { user_id } = req.decoded_authorization as TokenPayload
  const { body } = req
  // UPDATE LẠI USER
  const result = await usersService.updateMe(user_id, body)
  return res.json({
    message: USERS_MESSAGES.UPDATE_ME_SUCCESS,
    result
  })
}

export const getProfileController = async (req: Request<GetProfileReqParams>, res: Response) => {
  // TÌM USERNAME THEO USERNAME
  const { username } = req.params
  const user = await usersService.getProfile(username)
  return res.json({
    message: USERS_MESSAGES.GET_PROFILE_SUCCESS,
    result: user
  })
}

export const followController = async (
  req: Request<ParamsDictionary, any, FollowReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload //lấy user_id từ decoded_authorization của access_token
  const { followed_user_id } = req.body //lấy followed_user_id từ req.body
  const result = await usersService.follow(user_id, followed_user_id) //chưa có method này
  return res.json(result)
}

export const unfollowController = async (req: Request<UnfollowReqParams>, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload //lấy user_id từ decoded_authorization của access_token
  const { user_id: followed_user_id } = req.params //lấy user_id từ req.params là user_id của người mà ngta muốn unfollow
  const result = await usersService.unfollow(user_id, followed_user_id) //unfollow chưa làm
  return res.json(result)
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload //lấy user_id từ decoded_authorization của access_token
  const { password } = req.body //lấy old_password và password từ req.body
  const result = await usersService.changePassword(user_id, password) //chưa code changePassword
  return res.json(result)
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response,
  next: NextFunction
) => {
  // khi qua middleware refreshTokenValidator thì ta đã có decoded_refresh_token
  //chứa user_id và token_type
  //ta sẽ lấy user_id để tạo ra access_token và refresh_token mới
  const { refresh_token } = req.body
  const { user_id, verify } = req.decoded_refresh_token as TokenPayload //lấy refresh_token từ req.body
  const result = await usersService.refreshToken({ user_id, refresh_token, verify }) //refreshToken chưa code
  return res.json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS, //message.ts thêm  REFRESH_TOKEN_SUCCESS: 'Refresh token success',
    result
  })
}
