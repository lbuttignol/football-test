const mysql = require('mysql2');

const config = {
  connectionLimit: 100,
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
}

// create the connection
// const con = mysql.createConnection(config);
const con = mysql.createPool(config);

module.exports = con;

