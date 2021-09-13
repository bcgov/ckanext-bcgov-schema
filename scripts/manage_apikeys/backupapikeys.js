const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    user: process.env.DB_USER ? process.env.DB_USER : 'ckan',
    host: process.env.DB_HOST ? process.env.DB_HOST : '127.0.0.1',
    database: process.env.DB_NAME ? process.env.DB_NAME : 'ckan',
    password: process.env.DB_PASS ? process.env.DB_PASS : 'ckan',
    port: process.env.DB_PORT ? process.env.DB_PORT : 5432,
});
pool.connect();
  
console.log({
    user: process.env.DB_USER ? process.env.DB_USER : 'ckan',
    host: process.env.DB_HOST ? process.env.DB_HOST : '127.0.0.1',
    database: process.env.DB_NAME ? process.env.DB_NAME : 'ckan',
    password: process.env.DB_PASS ? process.env.DB_PASS : 'ckan',
    port: process.env.DB_PORT ? process.env.DB_PORT : 5432,
});

async function getNamesAndApikeys() {
    try {
        let res = await pool.query('SELECT name, apikey FROM public.user');

        return res.rows;
    } catch(err) {
        console.error(err);
    }
}

function saveNamesAndApikeys(fileName, namesAndKeys) {
    try {
        fs.writeFileSync(fileName, JSON.stringify(namesAndKeys));  
    } catch (err) {
        console.error(err);
    }
}

async function main() {
    const userFileName = process.argv[2];

    let users = await getNamesAndApikeys();
    
    saveNamesAndApikeys(userFileName, users);

    console.log('Backed up apikeys!');
    process.exit();
}

main();
