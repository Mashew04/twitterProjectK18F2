import User from '~/models/schemas/User.schema'
import databaseServices from './database.services'
import { RegisterReqBody } from '~/models/requests/User.request'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enums'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/messages'

class UsersService {
  // HÀM NHẬN VÀP USER_ID VÀ BỎ VÀO PAYLOAD ĐỂ TẠO ACCESS_TOKEN
  private signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    })
  }
  // HÀM NHẬN VÀP USER_ID VÀ BỎ VÀO PAYLOAD ĐỂ TẠO REFRESH_TOKEN
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }
  // KÍ ACCESS_TOKEN VÀ REFRESH_TOKEN
  private signAccessAndFreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
  }

  async checkEmailExist(email: string) {
    const users = await databaseServices.users.findOne({ email })
    return Boolean(users)
  }
  async register(payload: RegisterReqBody) {
    const result = await databaseServices.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    const user_id = result.insertedId.toString()
    const [access_token, refresh_token] = await this.signAccessAndFreshToken(user_id)
    // LƯU REFRESH_TOKEN VÀO db
    await databaseServices.refreshToken.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return { access_token, refresh_token }
  }

  async login(user_id: string) {
    const [access_token, refresh_token] = await this.signAccessAndFreshToken(user_id)
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
}

const usersService = new UsersService()
export default usersService
