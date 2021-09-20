const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const readline = require("readline");
const dbconnection = require('./dbconnection');

rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function getUserNames(pool) {
    try {
        let res = await pool.query('SELECT name FROM public.user');

        return res.rows;
    } catch(err) {
        console.error(err);
    }
}

// if passed an apikey, will use that to update, otherwise will generate a new one
async function updateUser(pool, name, apikey = uuidv4()) {
    try {
        await pool.query("UPDATE public.user SET apikey = $1 WHERE name = $2", [apikey, name]);
    } catch(err) {
        console.error(err);
    }
}

async function main() {
    try {
        const userFile = process.argv[2];

        const pool = dbconnection.connect();

        let users = [];
        // if passed a file location/name, will use that to update users, otherwise will get all users from db
        if (userFile) {
            users = JSON.parse(fs.readFileSync(userFile, 'utf8'));
        } else {
            users = await getUserNames(pool);
        }

        userFileQuestion = `Confirm you want to replace all apikeys with keys from ${userFile} (yes/no)? `;
        freshApikeyQuestion = "Confirm you would like to generate all new apikeys (yes/no)? ";
    
        rl.question(userFile ? userFileQuestion : freshApikeyQuestion, function(confimation) {
            if (confimation === 'yes') {
                for (let user of users) {
                    await updateUser(pool, user.name, user.apikey)
                }
    
                console.log('Updated apikeys!');
            }
    
            rl.close();
        })
    
        rl.on("close", function() {
            process.exit();
        })
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
