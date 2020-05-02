const mysql = require('mysql');
const connection = mysql.createConnection({
	// host: 'localhost',
	// host: '127.0.0.1',
	// host: process.env.DATABASE_HOST,
	// host: '172.21.0.2',
	// host: 'db',
	// host: '0.0.0.0',
	// host: process.env.MYSQL_HOST || '0.0.0.0',
	// port: 3306,
	// user: 'root',
	// password: process.env.MYSQL_ROOT_PASSWORD ||
  host: process.env.MYSQL_HOST,
  // port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
	// socketPath: '/var/run/mysqld/mysqld.sock' 

});


connection.connect((err)=>{
	console.log("process.env.MYSQL_HOST");
  console.log(process.env.MYSQL_HOST);
  console.log("process.env.MYSQL_PORT");
  console.log(process.env.MYSQL_PORT);
  console.log("process.env.MYSQL_USER");
  console.log(process.env.MYSQL_USER);
  console.log("process.env.MYSQL_PASSWORD");
  console.log(process.env.MYSQL_PASSWORD);
  console.log("process.env.MYSQL_DATABASE");
  console.log(process.env.MYSQL_DATABASE);
  if(err){
    console.error("error connecting: " + err.stack);
    return process.exit(22); //consistently exit so the Docker container will restart until it connects to the sql db
  }
  console.log("connected as id " + connection.threadId);
});

// select * from Competitions;
connection.query('SELECT 1 + 1 AS solution', (err, rows, fields)  => {
  if(err) {
  console.log('Data received from Db:');
  console.log("err");
  console.log(err);
  console.log("rows");
  console.log(rows);
  console.log("fields");
  console.log(fields);

  }
  console.log("query executed");
  console.log('rows');
  console.log(rows);
  console.log('fields');
  console.log(fields);
});

// connection.query('SELECT 1 + 1 AS solution', (err, rows, fields)  => {
//   if(err) throw err;

//   console.log('Data received from Db:');
//   console.log(rows);
//   console.log(rows[0].solution);
// });

connection.end(()=>{
	console.log('Mysql disconnected!');
});

module.exports = connection