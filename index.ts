import * as csv from "@softwareventures/csv";
import {recordsToTable} from "@softwareventures/table";
import program = require("commander");
import {ReadonlyDictionary} from "dictionary-types";
import * as dotenv from "dotenv";
import fs = require("fs");
import {version} from "./package.json";
import revolut = require("./revolut-api");


// Parse command line args
program
    .name("revolut-feed")
    .description("Experimental feed of transactions from Revolut")
    .version(version, "-v, --version", "output the current version")
    .option("-d, --debug", "connects and uses the sandbox environment")
    .option("-o, --output <name>", "/path/to/output csv filename", "revolut-feed.csv")
    .option("-f, --from <date>", "date for beginning of transaction search [Format yyyy/mm/dd]")
    .option("-t, --to <date>", "date for the end of the transaction search [Format yyyy/mm/dd] (default: 'now' [today's date])");

program.parse(process.argv);

// Inits .env file, making it accessible in process.env
dotenv.config();

// Define some constants we are going to use for the script
const CLIENT_ID = process.env.CLIENT_ID;
if (!CLIENT_ID) {
    throw new Error("CLIENT_ID environment variable not set, can't continue...");
}
const dev = !!program.debug;
const privateKey = process.env.SSL_PRIVATE_PATH as string;
const client = new revolut.Client(CLIENT_ID, dev, privateKey);

/**
 * Reverses a date string from yyyy-mm-dd returned from the api to dd/mm/yyyy
 * @param date - A string representation of a date yyyy-mm-dd
 * @return - A string representation of a date dd/mm/yyyy
 */
function reverseDateFormat(date: string): string {
    const oldDate: string = date.split("T")[0];
    const dateArray = oldDate.split("-");
    return dateArray.reverse().join("/");
}

/**
 * Sorts through an array of legs to get the GBP account leg
 * @param legs - An array of Legs from an revolut transaction object
 * @return - One leg from the transaction
 * @throws an error if there is no GBP account with the user
 */
function getLeg(legs: revolut.Leg[]): revolut.Leg {
    if (legs.length === 1) {
        return legs[0];
    }
    // If there is more than one leg, it is an exchange transaction
    // Script expects all exchanges to include the GBP account
    for (const leg of legs) {
        if (leg.currency === "GBP") {
            return leg;
        }
    }
    throw new Error("User has no GBP account...");
}

/**
 * Creates a ReadonlyDictionary to represent a row in the csv using a transaction
 * @param transaction - the transaction for this row in the csv
 * @param leg - the leg for the transaction that represents the interaction with the GBP account
 * @return - a row in the csv table
 */
function createTableRow(transaction: revolut.Transaction, leg: revolut.Leg): ReadonlyDictionary<string> {
    let description: string;
    if (transaction.reference) {
        description = transaction.reference; // Reference is set by our script for foreign exchanges
    } else {
        description = leg.description;
    }
    return {
        Date: reverseDateFormat(transaction.completed_at),
        Description: description,
        Net: leg.amount.toFixed(2),
        Balance: leg.balance.toFixed(2)
    };
}

/**
 * Finds matching foreign transaction to exchange transaction from a list of foreign transactions
 * @param exTrans - Exchange transaction from foreign currency => GBP
 * @param forTransactions - An array of foreign transactions that have happened before this exchange transaction
 * @return - exTrans with some modified meta data based on the foreign transaction
 */
function findForeignTrans(exTrans: revolut.Transaction,
                          forTransactions: revolut.Transaction[]): revolut.Transaction | false {
    // This for loop works because the transactions are listed from oldest to newest
    for (const forTrans of forTransactions) {
        for (const leg of exTrans.legs) {
            // This leg is the foreign currency leg of the exchange and the amount in the transaction is the same
            // Number is a negative version of the topup transaction, so needs to be made positive
            const legAmount = leg.amount * -1;
            if (leg.currency !== "GBP" && legAmount === forTrans.legs[0].amount) {
                const currency: string = forTrans.legs[0].currency;
                const amount: string = forTrans.legs[0].amount.toFixed(2);
                //
                exTrans.reference = forTrans.legs[0].description + ` (FX ${currency} ${amount})`;
                // Remove this transaction out of the list
                forTransactions.splice(forTransactions.indexOf(forTrans), 1);
                return exTrans;
            }
        }
    }
    console.warn(
        `Could not find equiv of foreign exchange: "${exTrans.legs[0].description}" on ${exTrans.completed_at}`
    );
    return false;
}

/**
 * Creates an array of dictionaries representing csv transaction data
 * @param acc - The users GBP account with revolut
 * @param transactions - An array of transactions to insert into the csv table
 * @return An array of dictionaries with string keys
 */
function createTable(acc: revolut.Account, transactions: revolut.Transaction[]): Array<ReadonlyDictionary<string>> {
    const tableRows: Array<ReadonlyDictionary<string>> = [];
    const foreignTrans: revolut.Transaction[] = [];
    // reversed as we need to insert transactions oldest first and they are in the array newest first
    for (const transaction of transactions.reverse()) {
        const leg: revolut.Leg = getLeg(transaction.legs);
        // Non-GBP transactions will be added to foreignTrans for future search of exchange transactions
        if (transaction.state === "completed") {
            if (acc.id !== leg.account_id) {
                // Transaction is not in the GBP account
                foreignTrans.push(transaction);
            } else {
                if (transaction.type === "exchange") {
                    // Is an exchange from a foreign currency account
                    const trans = findForeignTrans(transaction, foreignTrans);
                    if (trans) {
                        tableRows.push(createTableRow(trans, leg));
                    }
                } else {
                    // Can just be added to the table, no adjustments required
                    tableRows.push(createTableRow(transaction, leg));
                }
            }
        }
    }
    return tableRows;
}

// General flow
// #Get GBP account
// #Get transactions for account with the params given
// #cycle through all gbp account transactions
// #add them to table array
// if type 'exchange', go to original account and find original transaction
// replace info for this transaction for the exchange entry
//      throw warning if a transaction during this doesn't match up and cannot be found
// # write to csv

// Main Flow
client.authenticate()
    .then(authed => {
        if (authed) {
            console.log("successfully authenticated");
        }
        // This assumes the user has only one GBP account
        return client.getGBPAccount();
    })
    .then(async account => {
        // Write to csv here
        const transactions = await client.getTransactions(program.from, program.to, 1000);
        const rows = createTable(account, transactions);
        fs.writeFileSync(program.output, csv.write(recordsToTable(rows)));
        console.log("wrote csv to " + program.output);
        process.exit(0);
    })
    .catch(reason => {
        console.error("", reason);
        process.exit(5);
    });