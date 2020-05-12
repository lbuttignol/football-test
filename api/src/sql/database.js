const mysql = require( 'mysql' );

const config = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
}

// Mysql config params
// const config = {
//   // waitForConnections: true,
//   // connectionLimit: 10,
//   host: 'localhost',
//   user: 'mysql',
//   password: 'example',
//   database: 'footballdb'
// }

class Database {
    // constructor( conf ) {
    //     this.connection = mysql.createConnection( conf );
    // }
    constructor() {
        this.connection = mysql.createConnection( config );
    }
    
    query( sql, args ) {
        return new Promise( ( resolve, reject ) => {
            this.connection.query( sql, args, ( err, rows ) => {
                if ( err )
                    return reject( err );
                resolve( rows );
            } );
        } );
    }
    
    close() {
        return new Promise( ( resolve, reject ) => {
            this.connection.end( err => {
                if ( err )
                    return reject( err );
                resolve();
            } );
        } );
    }
}

module.exports = Database;

