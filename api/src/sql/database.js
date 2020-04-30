const mysql = require('mysql');
const connection = mysql.createConnection({
	// host: 'localhost',
	// host: '0.0.0.0',
	// host: '127.0.0.1',
	port: 3306,
	user: 'root',
  	// database: 'footballDb', 
	password: 'example'
	// socketPath: '/var/run/mysqld/mysqld.sock' 
});


connection.connect(()=>{
	console.log('Connected to mysql!');
});

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