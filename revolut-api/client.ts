
import fs = require("fs");
import readline = require("readline");
import {HTTPHelper} from "./http";
import {AccessToken, Account, Counterparty, RefreshToken, Transaction} from "./types";


// TODO: Figuring out we need to reauth
// TODO: Create file to manage io


/**
 * Handles the terminal input for the access code from the user
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

/**
 * Client class to wrap all interactions with the api
 */
export class Client {
    private readonly filename: string;
    private readonly clientId: string;
    private readonly dev: boolean;
    private http: HTTPHelper;
    private authenicated: boolean;
    private token: AccessToken;

    constructor(clientId: string, dev: boolean) {
        this.clientId = clientId;
        this.dev = dev;
        this.http = new HTTPHelper(this.clientId, this.dev);
        this.authenicated = false;
        this.filename = "./access_token.json";
        this.token = this.readToken() as AccessToken;
    }
    /**
     * Authenticates with the Revolut API. Needs to be called before using anything else in the client.
     * Returns true if the client is authenticated
     */
    public async authenticate(): Promise<boolean> {
        const token: AccessToken | false = this.readToken();
        if (!token) {
            const authCode = await getAccessCode();
            const response = await this.http.exchangeAccessCode(String(authCode));
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
     * Returns promise of of an Account object
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
     * Returns promise of an array of Account objects
     */
    public getAccounts(): Promise<Account[]> {
        if (!this.authenicated) {
            throw new Error("Not Authenticated"); // TODO: Fix this code duplication - Standardise errors
        }
        return this.http.getAccounts(this.token);
    }
    /**
     * Gets all of the counterparties of the user
     * Returns promise of an array of Counterparty objects
     */
    public getCounterparties(): Promise<Counterparty[]> {
        if (!this.authenicated) {
            throw new Error("Not Authenticated");
        }
        return this.http.getCounterparties(this.token);
    }
    /**
     * Gets the counterparty with the specified ID
     * Returns promise of a Countyparty object
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
     * Returns promise of an array of Transaction objects
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
     * Returns promise of a Transaction object
     */
    public getTransaction(id: string): Promise<Transaction> {
        if (!this.authenicated) {
            throw new Error("Not Authenticated");
        }
        return this.http.getTransaction(this.token, id);
    }
    /**
     * Reads token from disk
     * Returns AccessToken or false depending on if the token was able to be loaded
     */
    private readToken(): AccessToken | false {
        try {
            const rawData = fs.readFileSync(this.filename, "utf-8");
            const data = JSON.parse(rawData);
            return data as AccessToken;
        } catch (err) {
            return false;
        }
    }
    /**
     * Sets the given AccessToken object as the one stored on disk
     */
    private setToken(token: AccessToken): void {
        fs.writeFileSync(this.filename, JSON.stringify(token));
    }
    /**
     * Refresh the access token asynchronously
     * Returns a void promise
     */
    private async refreshToken(): Promise<void> {
        return this.getRefreshToken().then(refreshToken => {
            this.token.access_token = refreshToken.access_token;
            this.setToken(this.token);
        });
    }
    /**
     * Makes the http call to refresh the access token
     * Returns a RefreshToken object promise
     */
    private getRefreshToken(): Promise<RefreshToken> {
        return this.http.refreshToken(this.token.refresh_token);
    }
}
