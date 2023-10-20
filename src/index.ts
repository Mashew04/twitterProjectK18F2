import express from 'express'
import usersRoute from './routes/users.routes'
import  databaseServices  from './services/database.services'

const app = express()
app.use(express.json())

const PORT = 3000
databaseServices.connect()

// ROUTE LOCALHOST:3000/
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/users', usersRoute)
//localhost:3000/users/tweets

app.listen(PORT, () => {
  console.log(`Server đang chạy trên PORT ${PORT}`)
})
