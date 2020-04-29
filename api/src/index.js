const app = require('./config/server');

// import routes
require('./routes/hello')(app);

// start the server
app.listen(app.get('port'),()=>{
	console.log('Server running in port: ',app.get('port'));
});