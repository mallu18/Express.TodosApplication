const express = (require = 'express')
const sqlite3 = require('sqlite3')
const sqlite = require('sqlite')

const path = require('path')

const app = express()

app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializationDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite.Database,
    })

    await db.run(`

            CREATE TABLE IF NOT EXISTS todo(
                id INTEGER PRIMARY KEY,
                todo TEXT,
                priority TEXT,
                status TEXT
            );


        `)

    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializationDbAndServer()

app.get('/todos/', async (request, response) => {
  const {status, priority, search_q = ''} = request.query

  let query = `SELECT * FROM todo WHERE 1=1`

  if (status !== undefined) {
    query += ` AND status = '${status}'`
  }

  if (priority !== undefined) {
    query += ` AND priority = '${priority}'`
  }

  if (search_q !== '') {
    query += ` AND todo LIKE '%${search_q}%'`
  }

  const todos = await db.all(query)
  response.send(todos)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const todo = await db.get(`SELECT * FROM todo WHERE id = ${todoId};`)
  response.send(todo)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const insertQuery = `
    INSERT INTO todo (id, todo, priority, status)
    VALUES (${id}, '${todo}', '${priority}', '${status}');
  `
  await db.run(insertQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body

  const previousTodo = await db.get(`SELECT * FROM todo WHERE id = ${todoId};`)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = requestBody

  const updateQuery = `
    UPDATE todo
    SET todo = '${todo}', priority = '${priority}', status = '${status}'
    WHERE id = ${todoId};
  `
  await db.run(updateQuery)

  if (requestBody.status) {
    response.send('Status Updated')
  } else if (requestBody.priority) {
    response.send('Priority Updated')
  } else if (requestBody.todo) {
    response.send('Todo Updated')
  }
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  await db.run(`DELETE FROM todo WHERE id = ${todoId};`)
  response.send('Todo Deleted')
})

module.exports = app
