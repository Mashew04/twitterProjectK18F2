import { NextFunction, Request, Response, Router } from 'express'
import {
  emailVerifyTokenController,
  loginController,
  logoutController,
  registerController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'
const usersRoute = Router()

/*
des: đăng nhập
path: /users/login
method: POST
body: {email, password}
*/

usersRoute.get('/login', loginValidator, wrapAsync(loginController))

/*
Description : Register New User
Path : /register
Method : POST
body{
    name : string,
    email: string,
    password : string,
    confirm_password : string,
    date_of_birth : string theo chuẩn ISO 8601 ( Vì người dùng truyền JSON)

    // Quy ước collection trong Mongo là neckcase
}
*/
usersRoute.post('/register', registerValidator, wrapAsync(registerController))

/*
DES : Đăng xuất
Path : /users/logout
Method : POST
headers : {Authorization : 'Bear <access_token>' }
body : {refresh_token : String}


*/
usersRoute.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))

/*
DES : Verify Email
Khi người dùng đăng kí họ sẽ nhận được mail có link dạng 
http://localhost:3000/users/verify-email?token=<email_verify_token>
nếu mà e nhấp vào link thì sẽ tạo ra req gửi lên email_verify_token lên server
server kiểm tra email_verify_token có hợp lệ hay không ?
thì từ decoded_email_verify_token lấy ra user_id
và vào user_id đó để update email_verify_token thành '', verify = 1, update_at
method : POST
body : {email_verify_token : string }
*/

usersRoute.post('/verify-email', emailVerifyTokenValidator, wrapAsync(emailVerifyTokenController))

export default usersRoute
