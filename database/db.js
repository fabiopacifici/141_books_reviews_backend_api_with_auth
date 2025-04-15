const mysql = require('mysql2');

const credentials = {

  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || ''
}

const connection = mysql.createConnection(credentials)


connection.connect((err) => {
  if (err) throw err
  console.log('Connected to MySQL database!')
})


module.exports = connection;