
import * as dotenv from "dotenv";
import revolut = require("./revolut-api");


// Inits .env file, making it accessible in process.env
dotenv.config();

// Define some constants we are going to use for the script
let CLIENT_ID: string;
if (process.env.CLIENT_ID) {
    CLIENT_ID = process.env.CLIENT_ID;
} else {
    throw new Error("CLIENT_ID environment variable not set, can't continue...");
}

const dev: boolean = !!process.env.NODE_DEV;

const client = new revolut.Client(CLIENT_ID, dev);
client.authenticate()
    .then(authed => {
        if (authed) {
            console.log("successfully authenticated");
        }

        return client.getTransactions();
    })
    .then(trans => {
        console.log(trans[0].legs);
        // return open();
    })
    .catch(reason => {
        console.error("", reason);
        process.exit(5);
    });