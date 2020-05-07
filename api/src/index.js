const express     = require('express');
const bodyParser  = require('body-parser');
const path        = require('path');
const axios       = require('axios');
const mysql       = require('mysql2');

const app = express();

// settings
app.use(bodyParser.json());

// app.use(bodyParser.urlencoded({ extended: false }));
app.set('port', process.env.PORT || 3000);


// Mysql config params
const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
}

// create the connection
const con = mysql.createConnection(dbConfig);

// API header
const header = {'X-Auth-Token': '0c006aa5775f476bbd801d9d1443c1c3'};


// API connection data
const apiInfo = {
  host: 'https://api.football-data.org',
  path: '',
  method: 'get',
  headers: header
}

axios.interceptors.response.use(null, (error) => {
  console.log("in the interceptor!!");
  if (error.config && error.response && error.response.status === 429) {
    return axios.request(config);
  }
  return Promise.reject(error);
});

const getResource = (uri,apiData) => {
  apiData.url = apiData.host+uri;
  return axios(apiData);
}

// Interact with the API to bring a competition
const getCompetition = (code,str) =>{
  str.path = '/v2/competitions/'+code;
  str.url = str.host+str.path;
  

  axios(str)
  // .then(response => {
  //   // console.log(response);
  //   if (response.data) {
  //     obj = response.data;
  //     // this query check if the Competition was alredy imported
  //     dbConn.query(`SELECT * FROM competitions WHERE id=?`,obj.id)
  //     .then(rows => {
  //       console.log("select result");
  // //       console.log(result);
  //       if(result != ''){
          
  //         // Competition already imported
  //         console.log("This Competition was already imported.");
  //         res.status(409);
  //         res.json({message: "League already imported"});
  //       }
  //     })
  //     .catch(err =>{
  //       console.log("query error");

  //     });
  //   }
  // })
  // .catch (error => {
  //   console.log("error en getCompetition server.....");
  //   console.log(error);
  //   throw error;

  // }) 
}

// Interact with the API to bring all the teams in the competition
const getTeams = (leagueCode,str) =>{
  timeout('6s')
  str.path = '/v2/competitions/'+leagueCode+'/teams';
  str.url = str.host+str.path;
  try {
    return axios(str);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// Interact with the API to detailed information of a team
const getExtendedTeam = (teamId,str) =>{
  timeout('5s')
  str.path = '/v2/teams/'+teamId;
  str.url = str.host+str.path;
  try {
    return axios(str);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// sleep time expects milliseconds
function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}



// Router
// Hello world page
app.get('/',(req,res)=>{
  res.send("hello");
});

/* GET /import-league/<codeLeague>
 *
 * This requeriment search the body param <codeLeague> in the API
 * "api.football-data.org" and store the Competition in the local database.
 * 
 * Then search in the API all the Teams that participates in this Competition
 * and store them in the local database.
 * 
 * By last bring all the Players and store them.
 * 
 * Responses
 * 
 * HttpCode 201, {"message": "Successfully imported"} --> When the leagueCode 
 * was successfully imported.
 * 
 * HttpCode 409, {"message": "League already imported"} --> If the given
 * leagueCode was already imported into the DB (and in this case, it doesn't 
 * need to be imported again).
 * 
 * HttpCode 404, {"message": "Not found" } --> If the leagueCode was not found.
 * 
 * HttpCode 504, {"message": "Server Error" } --> If there is any connectivity
 * issue either with the football API or the DB server.
 * 
 */

app.get('/import-league/:cl', (req,res)=>{
  let a,b;
  console.log("hi");
  // search the competition in the API
  getResource('/v2/competitions/'+req.params.cl,apiInfo)
  .then(resp => {
    console.log("got the response");
    cmp = resp.data;
    // got the competition, so then must to check if exist on DB
    con.promise().query(`SELECT * FROM competitions WHERE id=?`,cmp.id)
    .then( ([rows,fields]) => {
      console.log("then1");
      if(rows != ''){
        // competition already imported
        console.log('competition already imported');
        res.status(409);
        res.json({message:"League already imported"});
  //
      }else{
        // insert the competition and all 
        con.promise().query(`INSERT INTO competitions (id, name,code, areaName) VALUES (?,?,?,?)`,
        [cmp.id,
         cmp.name,
         cmp.code,
         cmp.area.name])
        .then(([rows,fields])=>{
          console.log("INSERT INTO competitions (id, name,code, areaName) VALUES (?,?,?,?)");
          console.log("se ejecutó correctamente");
          //Search all teams in the competition
          getResource('/v2/competitions/'+req.params.cl+'/teams',apiInfo)
          .then(resp1 =>{
            console.log("traigo todos los equipos");
            console.log(resp1.data.teams);
            // iterate over every team to search his players
            tms = resp1.data.teams;
            for(const tm of tms){
              getResource('/v2/teams/'+tm.id,apiInfo)
              .then(resp2 => {
                console.log("Has complete data of team:");
                console.log(tm.id);
                
                con.promise().query(`INSERT INTO teams (id, name, tla, shortName, areaName, email) VALUES (?,?,?,?,?,?)`,
                [tm.id,
                 tm.name,
                 tm.tla,
                 tm.shortName,
                 tm.area.name,
                 tm.email])
                .then(([rows,fields])=>{
                  // insertar relaciones??
                  console.log("TERMINO DE INSERTAR??");
                  
                  // insert data of all players
                  for(const plyr of resp2.data.squad){
                    console.log("Insert player");
                    console.log(plyr.id);
                    con.promise().query(`INSERT INTO players (id, name, position, dateOfBirth, countryOfBirth, nacionality) VALUES (?,?,?,?,?,?)`,
                    [plyr.id,
                     plyr.name,
                     plyr.position,
                     plyr.dateOfBirth,
                     plyr.countryOfBirth,
                     plyr.nacionality])
                    .then(([rows,fields])=>{
                      // insert relationship team/player
                    })
                    .catch(e0=>{
                      console.log("catch0");
                      console.log(e0);
                    })
                  }
                })
                .catch(e1=>{
                  console.log("catch1");
                  console.log(e1);
                })

              })
              .catch(e2=>{
                console.log("catch2");
                console.log(e2);
              })
            }

          })
          .catch(e3=>{
            console.log("catch3");
            console.log(e3);
          })
        })
        .catch(e4=>{
          console.log("catch4");
          console.log(e4);
        })

      } 
    })
    .catch(err =>{
      console.log("catch fallo de base de datos: SELECT * FROM competitions WHERE id=? ");
      console.log(err);

    })
    .then( () => {
      console.log("then2");
      con.end()
    });

  })
  .catch(e =>{
    console.log("catch getResource0: competition");
    console.log(e);
    //tirar un connection error-- ver si es 404 o 504
  })
});




// start the server
app.listen(app.get('port'),()=>{
	console.log('Server running in port: ',app.get('port'));
});