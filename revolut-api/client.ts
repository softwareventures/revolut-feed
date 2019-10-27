
/**
 * @file Handles the client that users interact with the api with
 */

import {HTTPHelper} from "./http";
import {AccessToken, Account, Counterparty, Transaction} from "./types";


/** Client class to wrap all interactions with the api for the user */
export class Client {
    private readonly http: HTTPHelper;
    private token: AccessToken | null = null;

    /**
     * Create a client
     * @param clientId - api's app ID from revolut
     * @param dev - true if the program is being run in development mode
     * @param privateKey - path to the sll private key
     */
    constructor(private readonly clientId: string, private readonly dev: boolean, private readonly privateKey: string) {
        this.http = new HTTPHelper(this.clientId, this.dev);
    }
    /**
     * Authenticates with the Revolut API. Needs to be called before using anything else in the client.
     * @param token - the existing AccessToken, if any.
     * @param readAuthCode - a function that will be called if necessary to read an authorization code
     *   input by the user.
     * @return a new or existing AccessToken, or null if the client fails to authenticate
     */
    public async authenticate(token: AccessToken | null,
                              readAuthCode: () => Promise<string>): Promise<AccessToken | null> {
        if (token == null) {
            const authCode = await readAuthCode();
            this.token = await this.http.exchangeAccessCode(authCode, this.privateKey);
            return this.token;
        } else {
            this.token = token;
            return token;
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
        if (this.token == null) {
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
        if (this.token == null) {
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
        if (this.token == null) {
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
        if (this.token == null) {
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
        if (this.token == null) {
            throw new Error("Not Authenticated");
        }
        return this.http.getTransaction(this.token, id);
    }
    // /**
    //  * Refresh the access token asynchronously
    //  * @return - a void promise. This is so we don't have to deal with what getRefreshToken returns
    //  */
    // private async refreshToken(): Promise<void> {
    //     return this.getRefreshToken().then(refreshToken => {
    //         this.token.access_token = refreshToken.access_token;
    //         this.setToken(this.token);
    //     });
    // }
    // /**
    //  * Makes the http call to refresh the access token
    //  * @return - RefreshToken object as a promise
    //  */
    // private getRefreshToken(): Promise<RefreshToken> {
    //     return this.http.refreshToken(this.token.refresh_token, this.privateKey);
    // }
}
