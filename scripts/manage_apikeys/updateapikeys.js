const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
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

async function getUserNames() {
    try {
        let res = await pool.query('SELECT name FROM public.user');

        return res.rows;
    } catch(err) {
        console.error(err);
    }
}

async function updateUser(name) {
    try {
        const apikey = uuidv4();
        await pool.query("UPDATE public.user SET apikey = $1 WHERE name = $2", [apikey, name]);
    } catch(err) {
        console.error(err);
    }
}

async function main() {
    let users = await getUserNames();

    for (let user of users) {
        await updateUser(user.name, user.apikey);
    }

    console.log('Updated apikeys!');
    process.exit();

}

main();
