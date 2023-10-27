import { NextFunction, Request, Response, Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controllers'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'
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

export default usersRoute
