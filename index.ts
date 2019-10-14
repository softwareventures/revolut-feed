
import program = require("commander");
// import * as csv from "@softwareventures/csv";
import * as dotenv from "dotenv";
import revolut = require("./revolut-api");
// import {recordsToTable} from "@softwareventures/table";


// Parse command line args
// Needs program name and description
program
    .option("-d, --debug", "connects and uses the sandbox environment")
    .option("-f, --from <date>", "date for beginning of transaction search [Format yyyy/mm/dd]")
    .option("-t, --to <date>", "date for the end of the transaction search [Format yyyy/mm/dd] (defaults to 'now' if not given)");

program.parse(process.argv);

// Inits .env file, making it accessible in process.env
dotenv.config();

// Define some constants we are going to use for the script
const CLIENT_ID = process.env.CLIENT_ID;
if (!CLIENT_ID) {
    throw new Error("CLIENT_ID environment variable not set, can't continue...");
}
const dev = !!program.debug;
const client = new revolut.Client(CLIENT_ID, dev);

// @ts-ignore
// interface Table {
//     Date: string;
//     Description: string;
//     Net: string;
//     Balance: string;
// }

// General flow
// Get GBP account
// Get transactions for account with the params given
// cycle through all gbp account transactions
// add them to table array
// if type 'exchange', go to original account and find original transaction
// replace info for this transaction for the exchange entry
// write to csv

// Main Flow
client.authenticate()
    .then(authed => {
        if (authed) {
            console.log("successfully authenticated");
        }

        return client.getTransactions();
    })
    .then(trans => {
        // Write to csv here
        console.log(trans[0]);
    })
    .catch(reason => {
        console.error("", reason);
        process.exit(5);
    });