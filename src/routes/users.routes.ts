import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controllers'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'
const usersRoute = Router()

usersRoute.get('/login', loginValidator, loginController)

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
usersRoute.post('/register', registerValidator, registerController)

export default usersRoute
