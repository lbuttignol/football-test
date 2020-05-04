const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');


const app = express();

//import db connection
const dbConn = require('./sql/database');

// settings
app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
app.set('port', process.env.PORT || 3000);

// Router

app.get('/',(req,res)=>{
  res.send("hello");
});


/*
HttpCode 201, {"message": "Successfully imported"} --> When the leagueCode was
successfully imported.

HttpCode 409, {"message": "League already imported"} --> If the given
leagueCode was already imported into the DB (and in this case, it doesn't need
to be imported again).

HttpCode 404, {"message": "Not found" } --> if the leagueCode was not found.

HttpCode 504, {"message": "Server Error" } --> If there is any connectivity
issue either with the football API or the DB server.
*/
app.get('/import-league/:cl',(req,res)=>{

  // GET the remote Competition
  var request = http.request({
    host: 'api.football-data.org',
    port: 80,
    path: '/v2/competitions/'+req.params.cl,
    method: 'GET',
    headers: {
      // headers such as "Cookie" can be extracted from req object and sent to /test
      'X-Auth-Token': '0c006aa5775f476bbd801d9d1443c1c3'
    }
  }, response => {

    /*
    400 Bad Request | Your request was malformed. Most likely the value of a 
    Filter was not set according to the Data Type that is expected.
    
    403 Restricted Resource | You tried to access a resource that exists, but 
    is not available to you. This can be due to the following reasons:the 
    resource is only available to authenticated clients.the resource is only 
    available to clients with a paid subscription.the resource is not available 
    in the API version you are using.
    
    404 Not Found | You tried to access a resource that doesn't exist
    
    429 Too Many Requests | You exceeded your API request quota. See 
    Request-Throttling for more information.
    */

    if(response.statusCode == 400){
      res.json({message: "Bad Request", error: response.statusCode});
    }
    if(response.statusCode == 403){
      res.json({message: "Restricted Resource", error: response.statusCode});
    }
    if(response.statusCode == 404){
      res.json({message: "Not found", error: response.statusCode});
    }
    if(response.statusCode == 429){
      res.json({message: "Too Many Requests", error: response.statusCode});
    }
    
    var data = '';
    response.setEncoding('utf8');
    
    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      var obj = JSON.parse(data);
      console.log("obj");
      console.log(obj);
      res.json(obj);
    });
  
  });

  request.on('error', error => {
    console.error(error)
  });

  request.end();

});



// start the server
app.listen(app.get('port'),()=>{
	console.log('Server running in port: ',app.get('port'));
});