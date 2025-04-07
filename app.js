const express = require('express')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

// Initialize the database and server
const initializeDBAndServer = async () => {
  try {
    db = await open({filename: dbPath, driver: sqlite3.Database})

    await db.run(`
      CREATE TABLE IF NOT EXISTS todo (
        id INTEGER PRIMARY KEY,
        todo TEXT,
        priority TEXT,
        status TEXT
      );
    `)

    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (error) {
    console.error(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

/*
API 1: GET /todos/
Supports: status, priority, priority+status, search_q
*/
app.get('/todos/', async (request, response) => {
  const {status, priority, search_q = ''} = request.query

  let query = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`

  if (status && priority) {
    query += ` AND status = '${status}' AND priority = '${priority}'`
  } else if (status) {
    query += ` AND status = '${status}'`
  } else if (priority) {
    query += ` AND priority = '${priority}'`
  }

  const todos = await db.all(query)
  response.send(todos)
})

/*
API 2: GET /todos/:todoId/
Returns a specific todo by ID
*/
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const todo = await db.get(`SELECT * FROM todo WHERE id = ${todoId}`)
  response.send(todo)
})

/*
API 3: POST /todos/
Creates a new todo
*/
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const query = `
    INSERT INTO todo (id, todo, priority, status)
    VALUES (${id}, '${todo}', '${priority}', '${status}');
  `
  await db.run(query)
  response.send('Todo Successfully Added')
})

/*
API 4: PUT /todos/:todoId/
Updates todo fields one at a time (status, priority, todo)
*/
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body

  let updateColumn = ''
  let updateValue = ''

  if (requestBody.status) {
    updateColumn = 'status'
    updateValue = requestBody.status
    await db.run(
      `UPDATE todo SET status = '${updateValue}' WHERE id = ${todoId}`,
    )
    response.send('Status Updated')
  } else if (requestBody.priority) {
    updateColumn = 'priority'
    updateValue = requestBody.priority
    await db.run(
      `UPDATE todo SET priority = '${updateValue}' WHERE id = ${todoId}`,
    )
    response.send('Priority Updated')
  } else if (requestBody.todo) {
    updateColumn = 'todo'
    updateValue = requestBody.todo
    await db.run(`UPDATE todo SET todo = '${updateValue}' WHERE id = ${todoId}`)
    response.send('Todo Updated')
  }
})

/*
API 5: DELETE /todos/:todoId/
Deletes a todo
*/
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  await db.run(`DELETE FROM todo WHERE id = ${todoId}`)
  response.send('Todo Deleted')
})

/*
Export express instance using default export syntax
*/
module.exports = app
