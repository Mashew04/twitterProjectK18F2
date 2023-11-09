import User from '~/models/schemas/User.schema'
import databaseServices from './database.services'
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.request'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'

class UsersService {
  // HÀM NHẬN VÀP USER_ID VÀ BỎ VÀO PAYLOAD ĐỂ TẠO ACCESS_TOKEN
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, verify },
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    })
  }
  // HÀM NHẬN VÀP USER_ID VÀ BỎ VÀO PAYLOAD ĐỂ TẠO REFRESH_TOKEN
  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken, verify },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }

  // HÀM SIGNEMAILVERIFYTOKEN
  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerificationToken, verify },
      options: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
    })
  }
  // KÍ ACCESS_TOKEN VÀ REFRESH_TOKEN
  private signAccessAndFreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  async checkEmailExist(email: string) {
    const users = await databaseServices.users.findOne({ email })
    return Boolean(users)
  }
  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    const result = await databaseServices.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        username: `user${user_id.toString()}`,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    const [access_token, refresh_token] = await this.signAccessAndFreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })

    // LƯU REFRESH_TOKEN VÀO db
    await databaseServices.refreshToken.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    // GIẢ LẬP GỬI MAIL
    console.log(email_verify_token)
    return { access_token, refresh_token }
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndFreshToken({
      user_id,
      verify
    })
    //LƯU REFRESH_TOKEN VÀO DB
    await databaseServices.refreshToken.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return { access_token, refresh_token }
  }
  async logout(refresh_token: string) {
    await databaseServices.refreshToken.deleteOne({ token: refresh_token })
    return { message: USERS_MESSAGES.LOGOUT_SUCCESS }
  }
  async verifyEmail(user_id: string) {
    // UPDATE LẠI USER
    await databaseServices.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            verify: UserVerifyStatus.Verified,
            email_verify_token: '',
            update_at: '$$NOW'
          }
        }
      ]
    )
    // TẠO RA ACCESS TOKEN VÀ REFRESH TOKEN
    const [access_token, refresh_token] = await this.signAccessAndFreshToken({
      user_id,
      verify: UserVerifyStatus.Verified //1
    })
    // LƯU REFRESH_TOKEN VÀO DB
    await databaseServices.refreshToken.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return { access_token, refresh_token }
  }

  async resendEmailVerify(user_id: string) {
    // Tạo ra email_verify_token
    const email_verify_token = await this.signEmailVerifyToken({
      user_id,
      verify: UserVerifyStatus.Unverified // 0
    })
    // UPDATE LẠI USER
    await databaseServices.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          email_verify_token,
          update_at: '$$NOW'
        }
      }
    ])
    console.log(email_verify_token)
    return { message: USERS_MESSAGES.RESNED_EMAIL_VERIFY_SUCCESS }
  }

  // HÀM NHẬN VÀP USER_ID VÀ BỎ VÀO PAYLOAD ĐỂ TẠO REFRESH_TOKEN
  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken, verify },
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
    })
  }
  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    // TẠO RA FORGOT PASSWORD TOKEN
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })
    // UPDATE LẠI USER
    await databaseServices.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          forgot_password_token,
          update_at: '$$NOW'
        }
      }
    ])
    console.log(forgot_password_token)
    return { message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD }
  }

  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    //DỰA VÀO USED_ID TÌM USER VÀ CẬP NHẬT LẠI PASSWORD
    await databaseServices.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: '',
          update_at: '$$NOW'
        }
      }
    ])
    return { message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS }
  }

  async getMe(user_id: string) {
    const user = await databaseServices.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }
  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload

    //  CẬP NHẬT _PAYLOAD LÊN DB
    const user = await databaseServices.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      [
        {
          $set: {
            ..._payload,
            update_at: '$$NOW'
          }
        }
      ],
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }
  async getProfile(username: string) {
    const user = await databaseServices.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          create_at: 0,
          update_at: 0
        }
      }
    )
    if (user == null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
  }
}

const usersService = new UsersService()
export default usersService
