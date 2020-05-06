const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');

const app = express();

//import db interaction
const dbConn = require('./sql/database');

// settings
app.use(bodyParser.json());

// app.use(bodyParser.urlencoded({ extended: false }));
app.set('port', process.env.PORT || 3000);

// API header
const header = {'X-Auth-Token': '0c006aa5775f476bbd801d9d1443c1c3'};


const apiInfo = {
  host: 'https://api.football-data.org',
  path: '',
  method: 'get',
  headers: header
}
// Interact with the API to bring a competition
const getCompetition = (code,str) =>{
  str.path = '/v2/competitions/'+code;
  str.url = str.host+str.path;
  try {
    return axios(str);
  } catch (error) {
    console.log("error en getCompetition server.....");
    console.log(error);
    throw error;
  }
}

// Interact with the API to bring all the teams in the competition
const getTeams = (leagueCode,str) =>{
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
  str.path = '/v2/team/'+teamId;
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

  getCompetition(req.params.cl,apiInfo)
  .then(response =>{
    if (response.data) {
      obj = response.data;
      // this query check if the Competition was alredy imported
      dbConn.query(`SELECT * FROM competitions WHERE id=?`,obj.id,(err,result)=>{
        if (err){
          
          // database error
          console.log('An error with the Database Conection has occurred');
          res.status(504);
          res.json({message: "Server Error"});
        }
        console.log("select result");
        console.log(result);
        if(result != ''){
          
          // Competition already imported
          console.log("This Competition was already imported.");
          res.status(409);
          res.json({message: "League already imported"});
        }else{
          // the competition must to be stored
          dbConn.query(`INSERT INTO competitions (id, name,code, areaName) VALUES (?,?,?,?)`,
          [obj.id,
           obj.name,
           obj.code,
           obj.area.name],(err,result)=>{
            if (err){
              // database error
              console.log('An error with the Database Conection has occurred');
              res.status(504);
              res.json({message: "Server Error"});
            }
            
            // Competition inserted  
            // Get all the teams in the competition
            getTeams(obj.id,apiInfo)
            .then(response => {
              console.log("teams response");
              console.log(response);
              // bring all teams 
              console.log("teams response data");
              console.log(response.data);
              console.log("teams response data teams");
              console.log(response.data.teams);
              tms = response.data.teams;
              for(const tm of tms){
                // insert every team of the competition
                // sleep(6000).then(() => {
                  
                  getExtendedTeam(tm.id,apiInfo)
                  .then(response =>{
                    extendedTm = response.data;
                    // Inserting Team to the database
                    db.query(`INSERT INTO teams (id, name, tla, shortName, areaName, email) VALUES (?,?,?,?,?,?)`,
                    [extendedTm.id,
                     extendedTm.name,
                     extendedTm.tla,
                     extendedTm.shortName,
                     extendedTm.area.name,
                     extendedTm.email],(err,result)=>{
                      if(err){
                        console.log('An error with the Database Conection has occurred');
                        res.status(504);
                        res.json({message: "Server Error"});
                      }

                      // insert Relationship competition team
                      // 

                      plyrs = extendedTm.squad;
                      // Inserting players into database
                      for(const plyr of plyrs){
                        // only players filter
                        if(plyr.role == "PLAYER"){
                          db.query(`INSERT INTO players (id, name, position, dateOfBirth, countryOfBirth, nacionality) VALUES (?,?,?,?,?,?)`,
                          [plyr.id,
                           plyr.name,
                           plyr.position,
                           plyr.dateOfBirth,
                           plyr.countryOfBirth,
                           plyr.nacionality],(err,result)=>{
                            if(err){
                              console.log('An error with the Database Conection has occurred');
                              res.status(504);
                              res.json({message: "Server Error"});
                            }
                          });

                          // insert Relationship team player
                          // 
                        }

                      }

                    });

                  })

                // });

              }

            })
            .catch(e => {
              res.status(504);
              res.json({message: "Server Error"});
            })

          });
        }

      });

    }else{
      // Probabkemente esto vuele 
      console.log("HAS NO DATA###########");
    }
  })
  //Competition errors
  .catch(error =>{
    errCode = error.response.data.errorCode
    if(errCode == 400 || errCode == 403 || errCode == 404 ){
      console.log("Your request was malformed.");
      console.log("You tried to access a resource that exists, but is not available to you.");
      console.log("Resource not found.");
      res.status(404);
      res.json({message: "Not found"});
    }
    if(error.response.data.errorCode == 429){
      console.log("You exceeded your API request quota.");
      res.json({message: "Too Many Requests", error: error.response.data.errorCode});
      // should try again later
    }
  })
});




// start the server
app.listen(app.get('port'),()=>{
	console.log('Server running in port: ',app.get('port'));
});