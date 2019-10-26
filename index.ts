import {filter, reverse} from "@softwareventures/array";
import * as csv from "@softwareventures/csv";
import {recordsToTable} from "@softwareventures/table";
import program = require("commander");
import {ReadonlyDictionary} from "dictionary-types";
import * as dotenv from "dotenv";
import {writeFileSync} from "fs";
import {readAccessToken, writeAccessToken} from "./access-token";
import {version} from "./package.json";
import {Account, Client, Leg, Transaction} from "./revolut-api";


// Parse command line args
program
    .name("revolut-feed")
    .description("Experimental feed of transactions from Revolut")
    .version(version, "-v, --version", "output the current version")
    .option("-d, --debug", "connects and uses the sandbox environment")
    .option("-o, --output <name>", "/path/to/output csv filename", "revolut-feed.csv")
    .option("-f, --from <date>", "date for beginning of transaction search [Format yyyy-mm-dd]")
    .option("-t, --to <date>", "date for the end of the transaction search [Format yyyy-mm-dd] (default: 'now' [today's date])");

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
const client = new Client(CLIENT_ID, dev, privateKey);

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
function getLeg(legs: ReadonlyArray<Leg>): Leg {
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
function createTableRow(transaction: Transaction, leg: Leg): ReadonlyDictionary<string> {
    let description = leg.description;
    if (transaction.reference) {
        description += ` - ${transaction.reference}`;
    }
    return {
        Date: reverseDateFormat(transaction.completed_at),
        Description: description,
        Net: leg.amount.toFixed(2),
        Balance: leg.balance.toFixed(2)
    };
}

/**
 * Finds matching foreign transaction to exchange transaction from a list of
 * foreign transactions. Update the exchange transaction with details from the
 * foreign transaction, and remove the foreign transaction from the list of
 * foreign transactions.
 *
 * @param exchangeTransaction - Exchange transaction from foreign currency to GBP
 * @param foreignTransactions - An array of foreign transactions that have
 *   happened before this exchange transaction
 * @return Null if there is no match, otherwise the updated exchange
 *   transaction, and the array of foreign transactions with the matching
 *   transaction removed.
 */
function matchForeignTransaction(exchangeTransaction: Transaction, foreignTransactions: ReadonlyArray<Transaction>): {
    updatedTransaction: Transaction,
    otherForeignTransactions: Transaction[]
} | null {
    // This for loop works because the transactions are listed from oldest to newest
    for (const foreignTransaction of foreignTransactions) {
        for (const foreignLeg of exchangeTransaction.legs) {
            // This leg is the foreign currency leg of the exchange and the amount in the transaction is the same
            // Number is a negative version of the topup transaction, so needs to be made positive
            const legAmount = -foreignLeg.amount;
            if (foreignLeg.currency !== "GBP" && legAmount === foreignTransaction.legs[0].amount) {
                const currency: string = foreignTransaction.legs[0].currency;
                const amount: string = foreignTransaction.legs[0].amount.toFixed(2);

                return {
                    updatedTransaction: {
                        ...exchangeTransaction,
                        reference: foreignTransaction.reference,
                        legs: [
                            {
                                ...getLeg(exchangeTransaction.legs),
                                description: foreignTransaction.legs[0].description + ` (FX ${currency} ${amount})`
                            }
                        ]
                    },
                    otherForeignTransactions: filter(foreignTransactions, t => t !== foreignTransaction)
                };
            }
        }
    }
    console.warn("Could not find matching foreign transaction for exchange: "
        + `"${exchangeTransaction.legs[0].description}" `
        + `${exchangeTransaction.legs[0].currency} ${(-exchangeTransaction.legs[0].amount).toFixed(2)} `
        + `to ${exchangeTransaction.legs[1].currency} ${exchangeTransaction.legs[1].amount.toFixed(2)} `
        + `on ${exchangeTransaction.completed_at}`);
    return null;
}

/**
 * Creates an array of dictionaries representing csv transaction data
 * @param acc - The users GBP account with revolut
 * @param transactions - An array of transactions to insert into the csv table
 * @return An array of dictionaries with string keys
 */
function createTable(acc: Account, transactions: ReadonlyArray<Transaction>): Array<ReadonlyDictionary<string>> {
    const tableRows: Array<ReadonlyDictionary<string>> = [];
    let foreignTrans: Transaction[] = [];
    // reversed as we need to insert transactions oldest first and they are in the array newest first
    for (const transaction of reverse(transactions)) {
        const leg: Leg = getLeg(transaction.legs);
        // Non-GBP transactions will be added to foreignTrans for future search of exchange transactions
        if (transaction.state === "completed") {
            if (acc.id !== leg.account_id) {
                // Transaction is not in the GBP account
                foreignTrans.push(transaction);
            } else {
                if (transaction.type === "exchange") {
                    // Is an exchange from a foreign currency account
                    const match = matchForeignTransaction(transaction, foreignTrans);
                    if (match) {
                        tableRows.push(createTableRow(match.updatedTransaction, match.updatedTransaction.legs[0]));
                        foreignTrans = match.otherForeignTransactions;
                    }
                } else {
                    // Can just be added to the table, no adjustments required
                    tableRows.push(createTableRow(transaction, leg));
                }
            }
        }
    }
    for (const foreignTransaction of foreignTrans) {
        console.warn("Could not find matching exchange for foreign transaction: "
            + `"${foreignTransaction.legs[0].description}" `
            + `${foreignTransaction.legs[0].currency} ${(-foreignTransaction.legs[0].amount).toFixed(2)} `
            + `on ${foreignTransaction.completed_at}`);
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
readAccessToken("access_token.json")
    .then(accessToken => client.authenticate(accessToken))
    .then(accessToken => {
        if (accessToken == null) {
            throw new Error("Authentication failed");
        } else {
            console.log("Successfully authenticated");
            return writeAccessToken("access_token.json", accessToken)
                .then(() => client.getGBPAccount());
        }
    })
    .then(async account => {
        // Write to csv here
        const transactions = await client.getTransactions(program.from, program.to, 1000);
        const rows = createTable(account, transactions);
        writeFileSync(program.output, csv.write(recordsToTable(rows)));
        console.log("wrote csv to " + program.output);
        process.exit(0);
    })
    .catch(reason => {
        console.error("", reason);
        process.exit(5);
    });