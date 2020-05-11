const axios       = require('axios');
const Database    = require('./sql/database');
// const mysql       = require('mysql2');

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
  console.log(error);
  if (error.response.status === 429) {
    console.log("Retrying time!!!! x-requestcounter-reset");
    // console.log(error.response.headers.x-requestcounter-reset);
    console.log("Retrying request!!!!");
    console.log(error.config)
    return axios.request(error.config);
  }
  return Promise.reject(error);
});

const getResource = (uri,apiData) => {
  apiData.url = apiData.host+uri;
  return axios(apiData);
}


function insertCompetition(comp){
  console.log('Ask if exist...');
  database = new Database();
  database.query(`SELECT * FROM competitions WHERE id=?`,comp.id)
  .then( (rows) => {
    // success db interaction
    console.log("then1");
    console.log("rows");
    console.log(rows);
    if(rows == ''){
      // insert the competition and all 
      console.log('Inserting competition...');
      return database.query(`INSERT INTO competitions (id, name,code, areaName) VALUES (?,?,?,?)`,
      [comp.id,comp.name,comp.code,comp.area.name]);
    }
    console.log('competition already imported throwing error');
    throw {message:"League already imported"};
  })
  .then(()=> database.close());
}

/**
 * 
 * @param items An array of items.
 * @param fn A function that accepts an item from the array and returns a promise.
 * @returns {Promise}
 */
function forEachPromise(items, fn, context) {
  console.log("looping!!!");
  return items.reduce((promise, item) => {
    return promise.then(() => {
      return fn(item,context);
    });
  }, Promise.resolve());
}

function insertTeam(team,comp){
  console.log("has a team");
  console.log("in the competition:::");
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
      if(rows == ''){
        // insert team
        console.log("Try to insert team")
        inserted = true;
        return database.query(`INSERT INTO teams (id, name, tla, shortName, areaName, email) VALUES (?,?,?,?,?,?)`,
        [team.id,
         team.name,
         team.tla,
         team.shortName,
         team.area.name,
         team.email]);
      }
      inserted = false;
      console.log("TEAM already inserted---------------------------------")
    })
    .then(()=>{
      console.log("-----------------------------------------------------insert relationship comp-team");
      return database.query('INSERT INTO comp_teams (competition_id,team_id) VALUES(?,?)',[comp.id,team.id]);
    })
    .then(()=> {
      database.close(); 
      if(inserted){
        console.log("go to insert players");
        console.log("team.squad------------------------");
        console.log(team.squad);
        return forEachPromise(team.squad,insertPlayer,team);
      }
    })
    .then(()=>{
      resolve();
    });
  });

}


function insertPlayer(pl,team){
  var player;
  return new Promise((resolve, reject)=>{
    database = new Database();
    console.log("inserting player");
    console.log("id: "+pl.id);
    console.log("team data player");
    console.log(team);
    if(pl.role == "PLAYER"){
      player = true;
      console.log("dateOfBirth");
      date = pl.dateOfBirth.slice(0,10); 
      return database.query('INSERT INTO players (id, name, position, dateOfBirth, countryOfBirth, nationality) VALUES(?,?,?,?,?,?)',
        [pl.id,              
         pl.name,            
         pl.position,        
         date,     
         pl.countryOfBirth,  
         pl.nationality])
      .then(()=>{
        console.log("insert team/player relationship")
        return database.query('INSERT INTO team_players (team_id, player_id) VALUES(?,?)',[team.id,pl.id]);
      })
      .then(()=>{
        console.log("HOLA---------");
        database.close();
      });
    }
    resolve();
  });
}

// here start the code 

let a,b;
console.log("hi");
param = 2000;
param = 2001;
// param = 2002;
// param = 2003;
// param = 2021;
// search the competition in the API

getResource('/v2/competitions/'+param,apiInfo)
.then((resp) =>{
  console.log("API retornó la competition");
  return insertCompetition(resp.data);
})
.then((resp0) => {
  console.log("competition inserted");
  return getResource('/v2/competitions/'+param+'/teams',apiInfo);
})
.then((resp1)=>{
  console.log("has info of all teams");
  debugger;
  return forEachPromise(resp1.data.teams,insertTeam,resp1.data.competition);
})
.then(()=>{
  console.log("done");
})
.catch((e)=>{
  console.log("ERROR");
  console.log(e);
})