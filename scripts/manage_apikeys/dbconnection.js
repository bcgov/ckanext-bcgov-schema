const { Pool } = require('pg');

function connect() {
    const connectInfo = {
        user: process.env.DB_USER ? process.env.DB_USER : 'ckan',
        host: process.env.DB_HOST ? process.env.DB_HOST : '127.0.0.1',
        database: process.env.DB_NAME ? process.env.DB_NAME : 'ckan',
        password: process.env.DB_PASS ? process.env.DB_PASS : 'ckan',
        port: process.env.DB_PORT ? process.env.DB_PORT : 5432,
    };
    
    const pool = new Pool(connectInfo);
    pool.connect();
      
    console.log(connectInfo);

    return pool;
}

exports.connect = connect;
