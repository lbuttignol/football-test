const app = require('./config/server');

//import db connection
const dbConn = require('./sql/database');

// import routes
require('./routes/hello')(app);

// start the server
app.listen(app.get('port'),()=>{
	console.log('Server running in port: ',app.get('port'));
});