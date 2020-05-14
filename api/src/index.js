const express     = require('express');
const bodyParser  = require('body-parser');
const path        = require('path');
const axios       = require('axios');
const Database    = require('./sql/database');

const app = express();

// settings
app.use(bodyParser.json());
app.set('port', process.env.PORT || 3000);

// API header
const header = {'X-Auth-Token': process.env.API_TOKEN};

// API connection data
const apiInfo = {
  host: 'https://api.football-data.org',
  path: '',
  method: 'get',
  headers: header
}

// Function that retry the request
axios.interceptors.response.use(null, (error) => {
  if (error.response.status === 429) {
    return axios.request(error.config);
  }
  return Promise.reject(error);
});

// Given an uri and the info of an api, executes the requeriment
const getResource = (uri,apiData) => {
  apiData.url = apiData.host+uri;
  return axios(apiData);
}

// Insert a competition into the local database
function insertCompetition(comp){
  database = new Database();
  return database.query(`SELECT * FROM competitions WHERE id=?`,comp.id)
  .then((rows) => {
    // success db interaction
    if(rows == ''){
      // insert the competition
      return database.query(`INSERT INTO competitions (id, name,code, areaName) VALUES (?,?,?,?)`,
      [comp.id,comp.name,comp.code,comp.area.name]);
    }
    // Competition already imported
    return Promise.reject({message:"League already imported", code : 409});
  })
  .catch((e)=>{
    console.log("Error inserting the competition");
    return Promise.reject(e);
  })
  .finally(()=> database.close());
}

/**
 * This function iterates over an array of items
 * 
 * @param items An array of items.
 * @param fn A function that accepts an item from the array and returns a promise.
 * @returns {Promise}
 */
function forEachPromise(items, fn, context) {
  return items.reduce((promise, item) => {
    return promise.then(() => {
      return fn(item,context);
    });
  }, Promise.resolve());
}

/* This function insert a team into the local database, also insert the relationship
 * between the competition and the team, the team players
 */
function insertTeam(team,comp){
  var inserted;
  return new Promise((resolve,reject) =>{
    database = new Database();
    // Bring all the data of a team from the api
    getResource('/v2/teams/'+team.id,apiInfo)
    .then((itemDetailed) =>{
      // Got the complete info of a team, now check if the team are inserted
      team = itemDetailed.data ;
      return database.query(`SELECT * FROM teams WHERE id=?`,itemDetailed.data.id);
    })
    .then((rows)=>{ 
      if(rows == ''){
        // If the team aren't inserted, then insert it
        console.log("Try to insert team");
        inserted = false;
        return database.query(`INSERT INTO teams (id, name, tla, shortName, areaName, email) VALUES (?,?,?,?,?,?)`,
        [team.id,
         team.name,
         team.tla,
         team.shortName,
         team.area.name,
         team.email]);
      }
      // If the team are inserted, then skip the team insertion and move to the relationship insertion
      inserted = true;
      return Promise.resolve();
    })
    .then(()=>{
      // Check if the relationship between competition and team is on the DB
      return database.query('SELECT * FROM comp_teams WHERE competition_id = ? and team_id = ?',[comp.id,team.id]);
    })
    .then((rows)=>{
      if(rows == ''){
        // Insert relationship between competition and team
        return database.query('INSERT INTO comp_teams (competition_id,team_id) VALUES(?,?)',[comp.id,team.id]);
      }

      // Competition and team inserted and related, 
      return Promise.resolve();
    })
    .then(()=> {
      // Now insert all the players if the team wasn't inserted before
      database.close(); 
      if(!inserted){
        // Skip the elements of the team that aren't "PLAYER"
        players = team.squad.filter((plyr) => {return plyr.role == "PLAYER"});
        // Iterate to insert
        return forEachPromise(players,insertPlayer,team);
      }

      return Promise.resolve();
    })
    .then(()=>{
      resolve();
    })
    .catch((e)=>{
      console.log("Error inserting Team!----------");
      console.log(e);
    });
  });

}

// Function that insert a player into the database
function insertPlayer(pl,team){
  database = new Database();
  return new Promise((resolve, reject)=>{
    // Cast dateOfBirth to allow insertion on mysql
    date = "" ; 
    if(pl.dateOfBirth != null){
      date = pl.dateOfBirth.slice(0,10); 
    }else{
      date = pl.dateOfBirth;
    }
    // Check if the player was inserted before
    database.query(`SELECT * FROM players WHERE id =?`,pl.id)
    .then((rows)=>{
      if(rows == ''){
        // Insert player
        return database.query('INSERT INTO players (id, name, position, dateOfBirth, countryOfBirth, nationality) VALUES(?,?,?,?,?,?)',
          [pl.id,              
           pl.name,            
           pl.position,        
           date,     
           pl.countryOfBirth,  
           pl.nationality])
      } 
      // Player already inserted, Skip player insertion to insert the relationship between team and player
      return Promise.resolve();
    })
    .then(()=>{
      // Tnsert the relationship between team and player
      return database.query('INSERT INTO team_players (team_id, player_id) VALUES(?,?)',[team.id,pl.id]);
    })
    .then(()=>{
      database.close();
      resolve();
    })
    .catch((e)=>{
      console.log("Error inserting a player");
      console.log(e);
    })
  });
}

// Router
// Hello world page
// app.get('/',(req,res)=>{
//   res.send("hello");
// });

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
  // search the competition in the API
  getResource('/v2/competitions/'+req.params.cl,apiInfo)
  .then((resp) =>{
    // Got the competition info, now insert the competition
    return insertCompetition(resp.data);
  })
  .then((resp0) => {
    // Competition inserted, now search all teams that belong to the competition
    return getResource('/v2/competitions/'+req.params.cl+'/teams',apiInfo);
  })
  .then((resp1)=>{
    // Got complete info of the team, now loop to insert it
    return forEachPromise(resp1.data.teams,insertTeam,resp1.data.competition);
  })
  .then(()=>{
    // REQUERIMIENT SUCCESFULLY EXECUTED
    res.status(201).json({message: "Successfully imported"})
  })
  .catch((e)=>{
    // error handling
    console.log("ERROR----------------------------------------");
    console.log(e);
    if(e.response){
      console.log("bla");
      res.status(404).json({message: "Not found"});
    }else if(e.code == 409){
      console.log("bla0");
      res.status(e.code).json({message: e.message});
    }else{
      console.log("bla01");
      res.status(504).json({message: "Server Error"});
    }
  });
});


app.get('/total-players/:cl',(req,res)=>{
  db = new Database();
  regex0 = /[0-9]+/;
  regex1 = /[A-Z]+[0-9]*/;
  param = req.params.cl;
  qry0 = '';
  qry1 = '';
  if(param.match(regex0)){
    // search by id
    qry0 = `SELECT COUNT(*) AS total FROM competitions WHERE competitions.id =? `;
    qry1 =`SELECT COUNT(*) AS total FROM competitions 
      INNER JOIN comp_teams ON competitions.id = comp_teams.competition_id 
      INNER JOIN team_players ON comp_teams.team_id = team_players.team_id
      WHERE competitions.id = ?`;
  }else if (param.match(regex1)){
    // search by code league
    qry0 = `SELECT COUNT(*) AS total FROM competitions WHERE competitions.code =? `;
    qry1 = `SELECT COUNT(*) as total FROM competitions 
      INNER JOIN comp_teams ON competitions.id = comp_teams.competition_id 
      INNER JOIN team_players ON comp_teams.team_id = team_players.team_id
      WHERE competitions.code = ?`;
  }else{
    throw new Error({message: "Bad Request"})
  }
  db.query(qry0,param)
  .then(([rows,field])=>{    
    if(rows.total == '0'){
      return Promise.reject({message: "Not Found"});
    }else{
      return db.query(qry1,param);
    }
  })
  .then(([rows,field])=>{
    res.status(200).json({ total : rows.total});
    db.close();
  })
  .catch((e)=> {
    res.status(404).json({message: "Not Found"});
  })

});

// start the server
app.listen(app.get('port'),()=>{
	console.log('Server running in port: ',app.get('port'));
});