
/**
 * @file Handles the client that users interact with the api with
 */

import {readFileSync, writeFileSync} from "fs";
import * as readline from "readline";
import {HTTPHelper} from "./http";
import {AccessToken, Account, Counterparty, RefreshToken, Transaction} from "./types";

/**
 * Handles the terminal input for the access code from the user
 * @return - the user input as a string promise.
 */
function getAccessCode(): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => {
        rl.question("Enter Access Code: ", (accessCode) => {
            rl.close();
            resolve(accessCode);
        });
    });
}


/** Client class to wrap all interactions with the api for the user */
export class Client {
    private readonly filename: string;
    private readonly clientId: string;
    private readonly dev: boolean;
    private readonly privateKey: string;
    private http: HTTPHelper;
    private authenicated: boolean;
    private token: AccessToken;

    /**
     * Create a client
     * @param clientId - api's app ID from revolut
     * @param dev - true if the program is being run in development mode
     * @param privateKey - path to the sll private key
     */
    constructor(clientId: string, dev: boolean, privateKey: string) {
        this.clientId = clientId;
        this.dev = dev;
        this.privateKey = privateKey;
        this.http = new HTTPHelper(this.clientId, this.dev);
        this.authenicated = false;
        this.filename = "./access_token.json";
        this.token = this.readToken() as AccessToken;
    }
    /**
     * Authenticates with the Revolut API. Needs to be called before using anything else in the client.
     * @return - true if the client is authenticated, false if it is not.
     */
    public async authenticate(): Promise<boolean> {
        const token: AccessToken | false = this.readToken();
        if (!token) {
            const authCode = await getAccessCode();
            const response = await this.http.exchangeAccessCode(authCode, this.privateKey);
            this.setToken(response);
            this.authenicated = true;
            return true;
        } else {
            await this.refreshToken();
            this.authenicated = true;
            return true;
        }
    }
    /**
     * Assuming the user has only one GBP account, gets that account
     * @return - promise of of an Account object
     * @throws error if the user has no GBP bank account
     */
    public getGBPAccount(): Promise<Account> {
        return this.getAccounts()
            .then(accounts => {
                for (const account of accounts) {
                    if (account.currency === "GBP") {
                        return account;
                    }
                }
                // Most likely will never reach here but exists to avoid the possibility of returning void
                throw new Error("No GBP account for logged in user.");
            });
    }
    /**
     * Gets all of the users bank accounts
     * @return - promise of an array of Account objects
     * @throws error if the client is not authenticated
     */
    public getAccounts(): Promise<Account[]> {
        if (!this.authenicated) {
            throw new Error("Not Authenticated");
        }
        return this.http.getAccounts(this.token);
    }
    /**
     * Gets all of the counterparties of the user
     * @return - promise of an array of Counterparty objects
     * @throws error if the client is not authenticated
     */
    public getCounterparties(): Promise<Counterparty[]> {
        if (!this.authenicated) {
            throw new Error("Not Authenticated");
        }
        return this.http.getCounterparties(this.token);
    }
    /**
     * Gets the counterparty with the specified ID
     * @param id - the id of the counterparty
     * @return - promise of a Countyparty object
     * @throws error if the client is not authenticated
     */
    public getCounterparty(id: string): Promise<Counterparty> {
        if (!this.authenicated) {
            throw new Error("Not Authenticated");
        }
        return this.http.getCounterparty(this.token, id);
    }
    /**
     * Gets transactions from this user with the given filters
     * The default limit of the api is 100, the max is 1000.
     * @param [from] - specifies from what date the transaction search should start from
     * @param [to] - specifies to what date the transaction search should end
     * @param [count] - sets limit for how many transactions should be in the search. This is 100 by default, 1000 max
     * @param [counterpartyID] - filters transaction search to only include transactions from specified counterparties
     * @return - promise of an array of Transaction objects
     * @throws error if the client is not authenticated
     */
    public getTransactions(from?: string, to?: string, count?: number,
                           counterpartyID?: string): Promise<Transaction[]> {
        if (!this.authenicated) {
            throw new Error("Not Authenticated");
        }
        // Limit of the api for count is 1000, going to struggle if we need to get more than this
        return this.http.getTransactions(this.token, from, to, count, counterpartyID);
    }
    /**
     * Gets the Transaction with the specified ID
     * @param id - the id of the transaction
     * @return - promise of a Transaction object
     * @throws error if the client is not authenticated
     */
    public getTransaction(id: string): Promise<Transaction> {
        if (!this.authenicated) {
            throw new Error("Not Authenticated");
        }
        return this.http.getTransaction(this.token, id);
    }
    /**
     * Reads token from disk
     * @return - AccessToken or false depending on if the token was able to be loaded
     */
    private readToken(): AccessToken | false {
        try {
            const rawData = readFileSync(this.filename, "utf-8");
            const data = JSON.parse(rawData);
            return data as AccessToken;
        } catch (err) {
            return false;
        }
    }
    /**
     * Sets the param token as the current access token. Writes this to disk and sets it in the class
     * @param token - the AccessToken object for the api
     */
    private setToken(token: AccessToken): void {
        writeFileSync(this.filename, JSON.stringify(token));
        this.token = token;
    }
    /**
     * Refresh the access token asynchronously
     * @return - a void promise. This is so we don't have to deal with what getRefreshToken returns
     */
    private async refreshToken(): Promise<void> {
        return this.getRefreshToken().then(refreshToken => {
            this.token.access_token = refreshToken.access_token;
            this.setToken(this.token);
        });
    }
    /**
     * Makes the http call to refresh the access token
     * @return - RefreshToken object as a promise
     */
    private getRefreshToken(): Promise<RefreshToken> {
        return this.http.refreshToken(this.token.refresh_token, this.privateKey);
    }
}
