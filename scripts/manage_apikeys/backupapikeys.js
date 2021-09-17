const { Pool } = require('pg');
const fs = require('fs');

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

async function getNamesAndApikeys() {
    try {
        let res = await pool.query('SELECT name, apikey FROM public.user');

        return res.rows;
    } catch(err) {
        console.error(err);
    }
}

function saveNamesAndApikeys(fileName, namesAndKeys) {
        fs.writeFileSync(fileName, JSON.stringify(namesAndKeys));  
}

async function main() {
    const userFileName = process.argv[2];

    let users = await getNamesAndApikeys();
    
    try {
        saveNamesAndApikeys(userFileName, users);

        console.log('Backed up apikeys!');
    } catch(err) {
        console.error(err);
    }

    process.exit();
}

main();
