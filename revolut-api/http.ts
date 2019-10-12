
import fs = require("fs");
import jwt = require("jsonwebtoken");
import request = require("request-promise-native");
import {AccessToken, Options} from "./types";


/**
 * Class to wrap all http requests with to make code simpler
 */
export class HTTPHelper {
    public readonly SUB_DOMAIN: string;
    public readonly API_SUB_DOMAIN: string;
    public readonly API_ROOT: string;
    private readonly localhost: string;
    private readonly CLIENT_ID: string;
    private readonly clientAssertionType: string;

    constructor(clientId: string, dev: boolean) {
        this.CLIENT_ID = clientId;
        if (dev) { // TODO: Document this behaviour in readme to help Dan with testing
            this.API_SUB_DOMAIN = "sandbox-b2b";
            this.SUB_DOMAIN = "sandbox-business";
        } else {
            this.API_SUB_DOMAIN = "b2b";
            this.SUB_DOMAIN = "business";
        }
        this.API_ROOT = `https://${this.API_SUB_DOMAIN}.revolut.com/api/1.0/`;
        this.clientAssertionType = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
        this.localhost = "127.0.0.1";
    }
    /**
     * Returns the generic revolut api access consent page for our app
     * returns string
     */
    public getAccessUrl(): string {
        return `https://${this.SUB_DOMAIN}.revolut.com/app-confirm?client_id=${this.CLIENT_ID}&redirect_uri=http://${this.localhost}`;
    }
    /**
     * Makes request to refresh access token
     * returns RequestPromise
     */
    public refreshToken(refreshToken: string): request.RequestPromise {
        const endpoint: string = "auth/token";
        const apiUrl: string = this.API_ROOT + endpoint;
        const options = { method: "POST",
            url: apiUrl,
            form: {
                grant_type: "refresh_token",
                refresh_token: refreshToken,
                client_id: this.CLIENT_ID,
                client_assertion_type: this.clientAssertionType,
                client_assertion: this.createSignedJWT()
            },
            json: true
        };
        return request(options);
    }
    /**
     * Makes request exchange access code for more permanent access and refresh tokens
     * returns RequestPromise
     */
    public exchangeAccessCode(authCode: string): request.RequestPromise {
        const endpoint: string = "auth/token";
        const apiUrl: string = this.API_ROOT + endpoint;
        const options = { method: "POST",
            url: apiUrl,
            form: {
                grant_type: "authorization_code",
                code: authCode,
                client_id: this.CLIENT_ID,
                client_assertion_type: this.clientAssertionType,
                client_assertion: this.createSignedJWT()
            },
            json: true
        };
        return request(options);
    }
    /**
     * Makes request to get all accounts for user
     * returns RequestPromise
     */
    public getAccounts(token: AccessToken): request.RequestPromise {
        const endpoint: string = "accounts";
        const options = this.createGenericGetOptions(endpoint, token.access_token);
        return request(options);
    }
    /**
     * Makes request to get counterparty with specified id
     * returns RequestPromise
     */
    public getCounterparty(token: AccessToken, id: string): request.RequestPromise {
        const endpoint: string = `counterparty/${id}`;
        const options = this.createGenericGetOptions(endpoint, token.access_token);
        return request(options);
    }
    /**
     * Makes request to get all counterparties for user
     * returns RequestPromise
     */
    public getCounterparties(token: AccessToken): request.RequestPromise {
        const endpoint: string = "counterparties";
        const options = this.createGenericGetOptions(endpoint, token.access_token);
        return request(options);
    }
    /**
     * Makes request to get transaction with specified id
     * returns RequestPromise
     */
    public getTransaction(token: AccessToken, id: string): request.RequestPromise {
        const endpoint: string = `transaction/${id}`;
        const options = this.createGenericGetOptions(endpoint, token.access_token);
        return request(options);
    }
    /**
     * Makes request to get all transactions for user
     * returns RequestPromise
     */
    public getTransactions(token: AccessToken): request.RequestPromise {
        const endpoint: string = "transactions";
        const options = this.createGenericGetOptions(endpoint, token.access_token);
        return request(options);
    }
    /**
     * Creates generic options for get requests for most of the revolut api
     * returns Options
     */
    private createGenericGetOptions(endpoint: string, accessToken: string): Options {
        return {
            method: "GET",
            url: this.API_ROOT + endpoint,
            headers: {Authorization: `Bearer ${accessToken}`},
            json: true
        };
    }
    /**
     * Creates a json web token (JWT)
     * returns signed jwt
     */
    private createSignedJWT(): string {
        const privateKeyName = "privatekey.pem"; // Should be valid path to the private key
        const privateKey = fs.readFileSync(privateKeyName);
        const issuer = this.localhost; // Issuer for JWT, should be derived from your redirect URL
        const revolutUrl = "https://revolut.com"; // Constant
        const payload = {
            iss: issuer,
            sub: this.CLIENT_ID,
            aud: revolutUrl
        };
        return jwt.sign(payload, privateKey, { algorithm: "RS256", expiresIn: 60 * 60});
    }
}
