const mysql = require('mysql');
const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

// insert Competition
const insertCompetition = (id,name,code,areaName) =>{
  // check nullable

  // create connection
  connection.connect((err)=>{
    if(err){
      console.error("error connecting: " + err.stack);
      return {"message": "Server Error" };
    }
    console.log("connected as id " + connection.threadId);
  });
  
  sql = `INSERT INTO competitions (id, name,code, areaName) VALUES ('${id}','${name}','${code}','${areaName}')`
  console.log(sql);
  connection.query(sql,(err,result)=>{
    if(err) return {"message": "Server Error"};
    return result;
  });

  // close connection
  connection.end(()=>{
  	console.log('Mysql disconnected!');
  });
}
// insert Team
const insertTeam = (id,name,code,areaName) =>{

}

// insert Player
const insertPlayer = (id,name,code,areaName) =>{

}

module.exports = {insertCompetition,insertTeam,insertPlayer};