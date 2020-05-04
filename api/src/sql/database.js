const mysql = require('mysql');
const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});


connection.connect((err)=>{
  if(err){
    console.error("error connecting: " + err.stack);
    return process.exit(22); //consistently exit so the Docker container will restart until it connects to the sql db
  }
  console.log("connected as id " + connection.threadId);
});

// 
connection.query('SELECT * from competitions', (err, rows, fields)  => {
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

connection.end(()=>{
	console.log('Mysql disconnected!');
});

module.exports = connection