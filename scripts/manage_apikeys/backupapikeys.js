const fs = require('fs');
const dbconnection = require('./dbconnection');

async function getNamesAndApikeys(pool) {
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
    try {
        const userFileName = process.argv[2];

        const pool = dbconnection.connect();
        let users = await getNamesAndApikeys(pool);
    

        saveNamesAndApikeys(userFileName, users);

        console.log('Backed up apikeys!');
    } catch(err) {
        console.error(err);
    }

    process.exit();
}

main();
