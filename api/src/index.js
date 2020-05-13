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

// function that retry the request
axios.interceptors.response.use(null, (error) => {
  if (error.response.status === 429) {
    return axios.request(error.config);
  }
  return Promise.reject(error);
});

const getResource = (uri,apiData) => {
  apiData.url = apiData.host+uri;
  return axios(apiData);
}


function insertCompetition(comp){
  database = new Database();
  return database.query(`SELECT * FROM competitions WHERE id=?`,comp.id)
  .then((rows) => {
    // success db interaction
    if(rows == ''){
      // insert the competition and all 
      console.log('Inserting competition...');
      return database.query(`INSERT INTO competitions (id, name,code, areaName) VALUES (?,?,?,?)`,
      [comp.id,comp.name,comp.code,comp.area.name]);
    }
    console.log('competition already imported throwing error');
    return Promise.reject({message:"League already imported", code : 409});
  })
  .catch((e)=>{
    console.log("Error inserting the competition");
    return Promise.reject(e);
  })
  .finally(()=> database.close());
}

/**
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

function insertTeam(team,comp){
  var inserted;
  return new Promise((resolve,reject) =>{
    database = new Database();
    getResource('/v2/teams/'+team.id,apiInfo)
    .then((itemDetailed) =>{
      console.log("---------- itemDetailed");
      team = itemDetailed.data ;
      return database.query(`SELECT * FROM teams WHERE id=?`,itemDetailed.data.id);
    })
    .then((rows)=>{ 
      console.log("----------------"); 
      if(rows == ''){
        // insert team
        console.log("Try to insert team")
        inserted = false;
        return database.query(`INSERT INTO teams (id, name, tla, shortName, areaName, email) VALUES (?,?,?,?,?,?)`,
        [team.id,
         team.name,
         team.tla,
         team.shortName,
         team.area.name,
         team.email]);
      }
      inserted = true;
      console.log("TEAM already inserted---------------------------------")
      // throw new Error({message:"Team already inserted"});
      return Promise.resolve();
    })
    .then(()=>{
      return database.query('SELECT * FROM comp_teams WHERE competition_id = ? and team_id = ?',[comp.id,team.id]);
    })
    .then((rows)=>{
      if(rows == ''){
        console.log("-----------------------------------------------------insert relationship comp-team");
        return database.query('INSERT INTO comp_teams (competition_id,team_id) VALUES(?,?)',[comp.id,team.id]);
      }

      console.log("Competition/Team relationship already inserted");
      return Promise.resolve();
    })
    .then(()=> {
      database.close(); 
      if(!inserted){
        console.log("go to insert players");
        players = team.squad.filter((plyr) => {return plyr.role == "PLAYER"});
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

function insertPlayer(pl,team){
  database = new Database();
  return new Promise((resolve, reject)=>{
    date = "" ; 
    if(pl.dateOfBirth != null){
      date = pl.dateOfBirth.slice(0,10); 
    }else{
      date = pl.dateOfBirth;
    }
    database.query(`SELECT * FROM players WHERE id =?`,pl.id)
    .then((rows)=>{
      if(rows != ''){
        // Player already inserted, call resolve to follow with the relationship insert
        return Promise.resolve();
      } 
      return database.query('INSERT INTO players (id, name, position, dateOfBirth, countryOfBirth, nationality) VALUES(?,?,?,?,?,?)',
        [pl.id,              
         pl.name,            
         pl.position,        
         date,     
         pl.countryOfBirth,  
         pl.nationality])
    })
    .then(()=>{
      console.log("insert team/player relationship")
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

// League codes

app.get('/import-league/:cl', (req,res)=>{
  // search the competition in the API
  getResource('/v2/competitions/'+req.params.cl,apiInfo)
  .then((resp) =>{
    console.log("API retornó la competition");
    return insertCompetition(resp.data);
  })
  .then((resp0) => {
    console.log("competition inserted");
    return getResource('/v2/competitions/'+req.params.cl+'/teams',apiInfo);
  })
  .then((resp1)=>{
    console.log("has info of all teams");
    return forEachPromise(resp1.data.teams,insertTeam,resp1.data.competition);
  })
  .then(()=>{
    console.log("done");
    res.status(201).json({message: "Successfully imported"})
  })
  .catch((e)=>{
    console.log("ERROR----------------------------------------");
    console.log(e);
    // if(e.response.status){
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