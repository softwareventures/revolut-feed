
/**
 * @file Handles all http requests away from users
 */

import {readFileSync} from "fs";
import * as jwt from "jsonwebtoken";
import * as request from "request-promise-native";
import {AccessToken, Options} from "./types";


/** Class to wrap all http requests with to make code simpler */
export class HTTPHelper {
    public readonly apiSubDomain: string;
    public readonly apiRoot: string;
    private readonly localhost: string;
    private readonly clientId: string;
    private readonly clientAssertionType: string;

    /**
     * Creates a HTTPHelper class
     * @param clientId - the client id from the revolut api app
     * @param dev - true or false for if the client is in development mode
     */
    constructor(clientId: string, dev: boolean) {
        this.clientId = clientId;
        if (dev) {
            this.apiSubDomain = "sandbox-b2b";
        } else {
            this.apiSubDomain = "b2b";
        }
        this.apiRoot = `https://${this.apiSubDomain}.revolut.com/api/1.0/`;
        this.clientAssertionType = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
        this.localhost = "127.0.0.1";
    }
    /**
     * Makes request to refresh access token
     * @param refreshToken - the refresh token that is part of the AccessToken object
     * @param privateKey - the path to private ssl key
     * @return -  RequestPromise
     */
    public refreshToken(refreshToken: string, privateKey: string): request.RequestPromise {
        const endpoint: string = "auth/token";
        const apiUrl: string = this.apiRoot + endpoint;
        const options = { method: "POST",
            url: apiUrl,
            form: {
                grant_type: "refresh_token",
                refresh_token: refreshToken,
                client_id: this.clientId,
                client_assertion_type: this.clientAssertionType,
                client_assertion: this.createSignedJWT(privateKey)
            },
            json: true
        };
        return request(options);
    }
    /**
     * Makes request exchange access code for more permanent access and refresh tokens
     * @param authCode - the auth code given after the user has given permission to the application
     * @param privateKey - the path to private ssl key
     * @return - RequestPromise
     */
    public exchangeAccessCode(authCode: string, privateKey: string): request.RequestPromise {
        const endpoint: string = "auth/token";
        const apiUrl: string = this.apiRoot + endpoint;
        const options = { method: "POST",
            url: apiUrl,
            form: {
                grant_type: "authorization_code",
                code: authCode,
                client_id: this.clientId,
                client_assertion_type: this.clientAssertionType,
                client_assertion: this.createSignedJWT(privateKey)
            },
            json: true
        };
        return request(options);
    }
    /**
     * Makes request to get all accounts for user
     * @param token - the AccessToken object for the api
     * @return - RequestPromise of accounts endpoint
     */
    public getAccounts(token: AccessToken): request.RequestPromise {
        const endpoint: string = "accounts";
        const options = this.createGenericGetOptions(endpoint, token.access_token);
        return request(options);
    }
    /**
     * Makes request to get counterparty with specified id
     * @param token - the AccessToken object for the api
     * @param id - the id of the counterparty
     * @return - RequestPromise of counterparty endpoint
     */
    public getCounterparty(token: AccessToken, id: string): request.RequestPromise {
        const endpoint: string = `counterparty/${id}`;
        const options = this.createGenericGetOptions(endpoint, token.access_token);
        return request(options);
    }
    /**
     * Makes request to get all counterparties for user
     * @param token - the AccessToken object for the api
     * @return - RequestPromise of counterparties endpoint
     */
    public getCounterparties(token: AccessToken): request.RequestPromise {
        const endpoint: string = "counterparties";
        const options = this.createGenericGetOptions(endpoint, token.access_token);
        return request(options);
    }
    /**
     * Makes request to get transaction with specified id
     * @param token - the AccessToken object for the api
     * @param id - the id of the transaction
     * @return - RequestPromise of transaction endpoint
     */
    public getTransaction(token: AccessToken, id: string): request.RequestPromise {
        const endpoint: string = `transaction/${id}`;
        const options = this.createGenericGetOptions(endpoint, token.access_token);
        return request(options);
    }
    /**
     * Makes request to get all transactions for user
     * @param token - the AccessToken object for the api
     * @param [from] - specifies from what date the transaction search should start from
     * @param [to] - specifies to what date the transaction search should end
     * @param [count] - sets limit for how many transactions should be in the search. This is 100 by default, 1000 max
     * @param [counterpartyID] - filters transaction search to only include transactions from specified counterparties
     * @return - promise of an array of Transaction objects
     */
    public getTransactions(token: AccessToken, from?: string, to?: string, count?: number,
                           counterpartyID?: string): request.RequestPromise {
        let endpoint: string = "transactions?";
        if (from) {
            endpoint += "from=" + from + "&";
        }
        if (to) {
            endpoint += "to=" + to + "&";
        }
        if (count as number >= 1) {  // If count is more than 0
            endpoint += "count=" + count + "&";
        }
        if (counterpartyID) {
            endpoint += "counterparty=" + counterpartyID + "&";
        }
        endpoint = endpoint.substr(0, endpoint.length - 1);
        const options = this.createGenericGetOptions(endpoint, token.access_token);
        return request(options);
    }
    /**
     * Creates generic options for get requests for most of the revolut api
     * @param endpoint - The endpoint for the api resource sans api root
     * @param accessToken - the string of access token in the AccessToken object, not the object
     * @return - Generic options object
     */
    private createGenericGetOptions(endpoint: string, accessToken: string): Options {
        return {
            method: "GET",
            url: this.apiRoot + endpoint,
            headers: {Authorization: `Bearer ${accessToken}`},
            json: true
        };
    }
    /**
     * Creates a json web token (JWT)
     * @param privateKeyName - the path to private ssl key
     * @return - signed jwt
     */
    private createSignedJWT(privateKeyName: string): string {
        const privateKey = readFileSync(privateKeyName);
        const issuer = this.localhost; // Issuer for JWT, should be derived from your redirect URL
        const revolutUrl = "https://revolut.com"; // Constant
        const payload = {
            iss: issuer,
            sub: this.clientId,
            aud: revolutUrl
        };
        return jwt.sign(payload, privateKey, { algorithm: "RS256", expiresIn: 60 * 60});
    }
}
